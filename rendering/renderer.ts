import { DrawOpt, DrawFunction, Axis, DrawableElementAttributes, } from "./generics.js";
import { Matrix } from "./matrices.js";
import { ProgramAttributes } from "./programAttributes.js";
import { GLRendererDelegate } from "./glRenderer.js";

type Buffer = {
      buffer: WebGLBuffer;
      location: number;
      data: TypedArray;
      numberOfComponents: number;
      attributeName: string;
      type?: number;
      stride?: number;
      offset?: number;
      normalize?: boolean;
}
type TypedArray = Float32Array | Float64Array | Uint16Array | Uint32Array | Int16Array | Int32Array;

export class GLRenderer {
      private _near: number = 0.1;
      private _far: number = 50;
      private _resolution: number;
      private _fieldOfView: number = 60;

      renderer;

      prospectiveMatrix: Float32Array = new Float32Array(16);

      static readonly axis = Axis;

      set zNear(zNear: number){
            if(this._near === zNear) return;
            this._near = zNear;
            this.updateProspectiveMatrix();
      }
      get zNear(){
            return this._near;
      }

      set zFar(zFar: number){
            if(this._far === zFar) return;
            this._far = zFar;
            this.updateProspectiveMatrix();
      }
      get zFar(){
            return this._far;
      }

      set fieldOfView(angle: number){
            if(this._fieldOfView === angle) return;
            this._fieldOfView = angle;
            this.updateProspectiveMatrix();
      }
      get fieldOfView(){
            return this._fieldOfView;
      }


      constructor(ctx: WebGLRenderingContext | null){
            if(!ctx) throw new Error("WebGL not available");
            this.renderer = new GLRendererDelegate(ctx);
            this._resolution = ctx.canvas.width/ctx.canvas.height;
            this.updateProspectiveMatrix();
      }

      private updateProspectiveMatrix(){
            this.prospectiveMatrix = new Float32Array(Matrix.prospective(this._fieldOfView, this._resolution, this._near, this._far));
      }
      /**
       * 
       * @param {TypedArray} data the data to fill the buffer with
       * @param type the type of the buffer (e.g. gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER)
       * @param numberOfComponents number between 1 and 4 that indicates number of components (default is 3)
       * @param staticDraw optional. if is true, the buffer is set to static usage, otherwise to dynamic (default to false)
       * @returns Buffer or null if the creation failed. initially, the location attribute is set to 0
       */
      createBuffer(data: TypedArray, type: number,  attributeName: string = '', numberOfComponents: number = 3, staticDraw: boolean = false): Buffer | null {
            const buffer = this.renderer.createBuffer(data, type, staticDraw);
            if(!buffer){
                  return null;
            }
            if(numberOfComponents <= 0 || numberOfComponents > 4){
                  console.warn('number of components must be greater than 0 and less than 4. automatically set to 3');
                  numberOfComponents = 3;
            }
            return {
                  buffer: buffer,
                  location: 0,
                  data: data,
                  numberOfComponents: Math.floor(numberOfComponents),
                  attributeName: attributeName
            }
      }
      resizeCanvas(width: number, height: number): void {
            this.renderer.resizeCanvas(width, height);
            this._resolution = width/height;
      }
      selectTranslationMatrix(opt: DrawOpt){
            if(opt.translationMatrix){
                  return opt.translationMatrix;
            }else if(opt.translation){
                  return Matrix.translate(opt.translation);
            }
            return null;
      }
      selectRotationMatrix(opt: DrawOpt){
            if(opt?.rotationMatrix){
                  return opt.rotationMatrix;
            }else if(opt.angle || opt.axis){
                  return Matrix.rotation(
                              (opt && opt.angle) || 0.0,
                              (opt && opt.axis) || Axis.X,
                              (opt && opt.toRad) || false
                  )
            }
            return null;
      }
      selectScaleMatrix(opt: DrawOpt){
            if(opt.scaleMatrix){
                  return  opt.scaleMatrix;
            }else if(opt.scale){
                  return Matrix.scale(opt.scale);
            }
            return null;
      }
      setTransformationMatrix(opt?: DrawOpt){
            let transformationMatrix = Matrix.IDENTITY_4X4;
            
            if(!opt) return transformationMatrix;

            if(opt.transformationMatrix) return opt.transformationMatrix;

            const translation = this.selectTranslationMatrix(opt);
            if(translation)
                  transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, translation);

            const rotation = this.selectRotationMatrix(opt);
            if(rotation)
                  transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, rotation);

            const scale = this.selectScaleMatrix(opt);
            if(scale)
                  transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, scale);

            if(opt.camera)
                  transformationMatrix = Matrix.composeMatrix(opt.camera.matrix, 4, transformationMatrix);
            return transformationMatrix;
      }
      getBuffersFromProgramAttributes(codeAttr: ProgramAttributes){
            const buffers: Buffer[] = [];
            for(let el of codeAttr.attributes){
                  const tmp = this.createBuffer(
                        new Float32Array(el.value), 
                        this.renderer.ARRAY_BUFFER, 
                        el.name, 
                        el.dim
                  );
                  if(!tmp)
                        return null;
                  buffers.push(tmp);
            }
            return buffers;
      }
      getDrawFunction(opt: DrawableElementAttributes): DrawFunction | null {
            const fillIndex = ()=>{
                  opt.indices = [];
                  for(let i = 0; i < opt.vertices.length/3; i++)
                        opt.indices.push(i);
            }
            const codeAttr = new ProgramAttributes(this, opt);

            const program = this.renderer.createProgram(codeAttr.vertex, codeAttr.fragment);
            if(!program) return null;

            const buffers: Buffer[] | null = this.getBuffersFromProgramAttributes(codeAttr);

            if(!buffers) return null;

            this.renderer.getAttribLocations(buffers, program);

            this.renderer.getUniformLocation(codeAttr.uniforms, program);

            if(!opt.indices) fillIndex();
            const indicesBuffer = this.createBuffer(new Uint16Array(opt.indices as number[]), this.renderer.ELEMENT_ARRAY_BUFFER);
            if(!indicesBuffer) return null;


            return (opt?: DrawOpt)=>{

                  this.renderer.useProgram(program);

                  this.renderer.bindBuffers(buffers);

                  this.renderer.bindIndicesBuffer(indicesBuffer.buffer);

                  codeAttr.uniforms[codeAttr.transform].value = this.setTransformationMatrix(opt);
                  codeAttr.uniforms[codeAttr.prospective].value = this.prospectiveMatrix;

                  if(codeAttr.animation >= 0){
                        codeAttr.uniforms[codeAttr.animation].value = opt?.animationVector || [0, 0];
                  }

                  this.renderer.bindUniforms(codeAttr.uniforms);
                  
                  this.renderer.draw(indicesBuffer.data.length)
            };
      }
}

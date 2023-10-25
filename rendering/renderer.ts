import { Color, DrawOpt, DrawFunction, Axis, DrawableElementAttributes, } from "./generics.js";
import { Matrix } from "./matrices.js";
import { ProgramAttributes } from "./programAttributes.js";

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
type Uniform = {
      location: WebGLUniformLocation;
      value: number | Iterable<number>;
      transpose: boolean;
      name: string;
      type: number;
}
type TypedArray = Float32Array | Float64Array | Uint16Array | Uint32Array | Int16Array | Int32Array;

export class GLRenderer {
      private _near: number = 0.1;
      private _far: number = 50;
      private _resolution: number;
      private _fieldOfView: number = 60;

      prospectiveMatrix: Float32Array = new Float32Array(16);
      gl: WebGLRenderingContext;

      static readonly axis = Axis;
      static readonly MAT4 = 1;
      static readonly TEXTURE = 2;
      static readonly FLOAT = 3;
      static readonly VEC4 = 4;
      static readonly MAT3 = 5;
      static readonly VEC2 = 6;

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
            this.gl = ctx;
            this._resolution = ctx.canvas.width/ctx.canvas.height;
            this.updateProspectiveMatrix();
      }

      private updateProspectiveMatrix(){
            this.prospectiveMatrix = new Float32Array(Matrix.prospective(this._fieldOfView, this._resolution, this._near, this._far));
      }
      /**
       * 
       * @param sourceCode the source code of the shader, must be a string
       * @param type can be gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
       * @returns WebGLShader or null if failed and console the error code if the shader creation failed
       */
      createShader(sourceCode: string, type: number): WebGLShader | null{
            const shader = this.gl.createShader(type);
            if(!shader){
                  console.error(this.gl.getError());
                  this.gl.deleteShader(shader);
                  return null;
            }
            this.gl.shaderSource(shader, sourceCode);
            this.gl.compileShader(shader);

            return shader;
      }
      /**
       * 
       * @param vShader string or WebGLShader. The code of vertex shader
       * @param fShader string or WebGLShader. The code of fragment shader
       * @returns {WebGLProgram | null} returns null if the program creation failed.
       */
      createProgram(vShader: string | WebGLShader, fShader: string | WebGLShader): WebGLProgram | null {
      
            const program = this.gl.createProgram();
            if(!program){
                  console.error(this.gl.getError());
                  this.gl.deleteProgram(program);
                  return null;
            }
            const vertexShader = typeof vShader == 'string'? this.createShader(vShader, this.gl.VERTEX_SHADER): vShader;
            if(!vertexShader){
                  return null;
            }
            this.gl.attachShader(program, vertexShader);  

            const fragmentShader = typeof fShader == 'string'? this.createShader(fShader, this.gl.FRAGMENT_SHADER): fShader;
            if(!fragmentShader){
                  return null;
            }
            this.gl.attachShader(program, fragmentShader);

            this.gl.linkProgram(program);

            this.gl.useProgram(program);

            if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                  console.error(this.gl.getProgramInfoLog(program));
                  return null;
            }

            return program;
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
            const buffer = this.gl.createBuffer();
            if(!buffer){
                  console.error(this.gl.getError());
                  return null
            }
            this.gl.bindBuffer(type, buffer);
            this.gl.bufferData(type, data, staticDraw? this.gl.STATIC_DRAW: this.gl.DYNAMIC_DRAW);
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
      createTexture(image: HTMLImageElement){

            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            // Fill the texture with a 1x1 blue pixel.
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
            // Now that the image has loaded make copy it to the texture.
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,this.gl.UNSIGNED_BYTE, image);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            //this.gl.generateMipmap(this.gl.TEXTURE_2D);
            return texture;
      }
      enableCulling(depthTest: boolean = true): void {
            depthTest && this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.enable(this.gl.CULL_FACE);
            this.gl.frontFace(this.gl.CCW);
            this.gl.cullFace(this.gl.BACK);
            this.gl.depthFunc(this.gl.LEQUAL);
      }
      resizeCanvas(width: number, height: number): void {
            this.gl.canvas.width = width;
            this.gl.canvas.height = height;
            this._resolution = width/height;
      }
      getUniformLocation(uniforms: Uniform[], program: WebGLProgram){
            for(let el of uniforms) {
                  el.location = this.gl.getUniformLocation(program, el.name) as WebGLUniformLocation;
            }
      }
      getAttribLocations(attributes: Buffer[], program: WebGLProgram): Buffer[] {
            for(let el of attributes){
                  el.location = this.gl.getAttribLocation(program, el.attributeName);
            }
            return attributes;
      }
      bindBuffers(buffers: Buffer[]): void {
            for(let bufferData of buffers){
                  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.buffer);
                  this.gl.enableVertexAttribArray(bufferData.location);
                  this.gl.vertexAttribPointer(
                        bufferData.location, 
                        bufferData.numberOfComponents, 
                        bufferData.type || this.gl.FLOAT, 
                        bufferData.normalize || false, 
                        bufferData.stride || 0, 
                        bufferData.offset || 0
                  );
            }
      }
      bindUniforms(uniforms: Uniform[]): void {
            for(let el of uniforms) {
                  switch(el.type) {
                        case GLRenderer.TEXTURE:{
                              this.gl.uniform1i(el.location, 0);
                        }break;
                        case GLRenderer.MAT4:{
                              if(typeof el.value == 'number' || !el.value) break;
                              this.gl.uniformMatrix4fv(el.location, el.transpose, el.value);
                        }break;
                        case GLRenderer.MAT3:{
                              if(typeof el.value == 'number' || !el.value) break;
                              this.gl.uniformMatrix3fv(el.location, el.transpose, el.value);
                        }break;
                        case GLRenderer.FLOAT: {
                              if(typeof el.value != 'number' || !el.value) break;
                              this.gl.uniform1f(el.location, el.value);
                        }break;
                        case GLRenderer.VEC4: {
                              if(typeof el.value == 'number' || !el.value) break;
                              this.gl.uniform4fv(el.location, el.value);
                        }break;
                        case GLRenderer.VEC2: {
                              if(typeof el.value == 'number' || !el.value) break;
                              this.gl.uniform2fv(el.location, el.value);
                        }
                  }
            }
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
      getDrawFunction(opt: DrawableElementAttributes): DrawFunction | null {
            const fillIndex = ()=>{
                  opt.indices = [];
                  for(let i = 0; i < opt.vertices.length/3; i++)
                        opt.indices.push(i);
            }
            const codeAttr = new ProgramAttributes(this, opt);

            const program = this.createProgram(codeAttr.vertex, codeAttr.fragment);
            if(!program) return null;

            const buffers: Buffer[] = [];
            for(let el of codeAttr.attributes){
                  const tmp = this.createBuffer(
                        new Float32Array(el.value), 
                        this.gl.ARRAY_BUFFER, 
                        el.name, 
                        el.dim
                  );
                  if(!tmp)
                        return null;
                  buffers.push(tmp);
            }

            this.getAttribLocations(buffers, program);

            this.getUniformLocation(codeAttr.uniforms, program);

            if(!opt.indices) fillIndex();
            const indicesBuffer = this.createBuffer(new Uint16Array(opt.indices as number[]), this.gl.ELEMENT_ARRAY_BUFFER);
            if(!indicesBuffer) return null;


            return (opt?: DrawOpt)=>{

                  this.gl.useProgram(program);

                  this.bindBuffers(buffers);

                  this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer.buffer);

                  codeAttr.uniforms[codeAttr.transform].value = this.setTransformationMatrix(opt);
                  codeAttr.uniforms[codeAttr.prospective].value = this.prospectiveMatrix;

                  if(codeAttr.animation >= 0){
                        codeAttr.uniforms[codeAttr.animation].value = opt?.animationVector || [1, 0, 0, 0, 1, 0, 0, 0, 1];
                  }

                  this.bindUniforms(codeAttr.uniforms);
                  
                  this.gl.drawElements(this.gl.TRIANGLES, indicesBuffer.data.length, this.gl.UNSIGNED_SHORT, 0)
            };
      }
      /**
       * 
       * @param color optional. The color to use to clear the screen
       */
      clear(color?: Color): void {
            if(color){
                  this.gl.clearColor(color.r, color.g, color.b, color.a);
            }
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BITS);
      }
}

import { WebGLRenderer } from "./glRenderer.js";
import { ViewDelegate } from "./viewMatrix.js";
import * as Type from './rendererModel.js';
import { ProgramAttributes } from "./programAttributes.js";
import { DrawOpt } from "./generics.js";

export type BufferOpt = {
      buffer?: Type.Buffer;          // The WebGL buffer object.
      location?: number;             // Attribute location in a shader program.
      data: Type.TypedArray;              // The data to fill the buffer with, of type TypedArray.
      numberOfComponents?: number;    // Number of components per vertex attribute (e.g., 1, 2, 3, or 4).
      attributeName: string;         // Name of the attribute.
      type?: number;                 // WebGL buffer type (e.g., gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER).
      stride?: number;               // Specifies the offset in bytes between consecutive vertex attributes.
      offset?: number;               // Specifies an offset in bytes of the first component in the vertex attribute array.
      normalize?: boolean;  
      indices?: boolean;
      staticDraw?: boolean;
      dataType?: number; 
}

export type DrawableElementAttributes = {
      vertices: number[];
      color?: number[];
      indices?: number[];
      textureCoords?: number[];
      image?: HTMLImageElement; 
      animate?: boolean;
}


export class RendererDelegate extends WebGLRenderer {

      private viewDelegate: ViewDelegate;

      constructor(cvs: HTMLCanvasElement){
            const ctx = cvs.getContext('webgl');
            if(!ctx){
                  throw 'something went wrong in canvas initialization (WebGL context)';
            }
            super(ctx);
            this.viewDelegate = new ViewDelegate(cvs.width/cvs.height);
      }

      createBufferData(bufferData: BufferOpt): Type.BufferData {
            const buffer = bufferData.buffer || this.createBuffer(bufferData.data,bufferData.type, bufferData.staticDraw);
            return {
                  attributeName: bufferData.attributeName,
                  buffer: buffer,
                  data: bufferData.data,
                  indices: bufferData.indices || false,
                  numberOfComponents: bufferData.numberOfComponents || 3,
                  location: bufferData.location || 0,
                  type: bufferData.type || this.BUFFER,
                  dataType: bufferData.dataType || this.FLOAT,
                  stride: bufferData.stride || 0,
                  offset: bufferData.offset || 0,
                  normalize: bufferData.normalize || false
            }

      }

      createUniform(name: string, type?: number, value: number | Iterable<number> = 0, transpose: boolean = false): Type.UniformData {
            return {
                  name: name,
                  transpose: transpose,
                  value: value,
                  location: 0,
                  dataType: type || (typeof value == 'number' ? this.FLOAT : this.MAT4),
            };
      }

      bindUniforms(uniforms: Type.UniformData[]): void {
            for(let uniform of uniforms){
                  this.bindUniform(uniform);
            }
      }

      bindAttributeBuffers(attributes: Type.BufferData[]): void {
            for(let attribute of attributes){
                  this.bindAndEnableBuffer(attribute);
            }
      }

      getAttributesLocations(program: Type.Program, buffers: Type.BufferData[]): Type.BufferData[] {
            for(let buffer of buffers){
                  buffer.location = this.getAttributeLocation(buffer.attributeName, program);
            }
            return buffers;
      }

      getAttributesData(buffersData: BufferOpt[]): Type.BufferData[] {
            const buffers: Type.BufferData[] = [];
            for(let data of buffersData){
                  buffers.push(
                        this.createBufferData(data)
                  );
            }
            return buffers;
      }

      getUniformsLocations(program: Type.Program, uniforms: Type.UniformData[]){
            for(let uniform of uniforms){
                  uniform.location = this.getUniformLocation(uniform.name, program);
            }
            return uniforms;
      }

      getDrawFunction(opt: DrawableElementAttributes){
            const fillIndex = ()=>{
                  opt.indices = [];
                  for(let i = 0; i < opt.vertices.length/3; i++) {
                        opt.indices.push(i);
                  }
            }
            if(!opt.indices){
                  fillIndex();
            }

            const programAttributes = new ProgramAttributes(this, opt);

            const program = this.createProgram(programAttributes.vertex, programAttributes.fragment);

            this.getAttributesLocations(program, programAttributes.attributes);

            this.getUniformsLocations(program, programAttributes.uniforms);

            const indexBuffer = this.createBufferData({
                  attributeName: '',
                  data: new Uint16Array(opt.indices as number[]),
                  indices: true,
                  type: this.INDEX_BUFFER
            });


            return (opt?: DrawOpt) => {

                  this.useProgram(program);
      
                  // Bind buffers for rendering
                  this.bindAttributeBuffers(programAttributes.attributes);
      
                  // Bind the indices buffer
                  this.bindBuffer(indexBuffer);
            
                  programAttributes.setMatrices(
                        this.viewDelegate.getTransformationMatrix(opt),
                        this.viewDelegate.prospectiveMatrix,
                        opt?.animationVector
                  );
            
                  // Bind uniforms for rendering
                  this.bindUniforms(programAttributes.uniforms);
            
                  // Draw elements
                  this.draw(indexBuffer.data.length);
            };
      }
}
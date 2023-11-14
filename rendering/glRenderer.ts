import { WebGL } from './codeDelegates/GLcode.js';
import { DrawableElementAttributes, RenderFunction, ProgramMode, BufferDataType, BufferUsage, Primitives } from './generics.js';
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";

export class Renderer extends WebGL { 

      protected functions: RenderFunction[] = [];
      protected renderPassDescriptor?: GPURenderPassDescriptor;


      async init(): Promise<this> {
            return this;
      }

      create( opt: DrawableElementAttributes ): RenderFunction {

            const data = ProgramSetterDelegate.getProperties( opt, ProgramMode.webgl, false );
            const program = this.createProgram( {
                  vShader: data.vertex,
                  fShader: data.fragment,
                  buffers: [],
                  stride: 0,
            });
            const vertexBuffers: WebGLBuffer[] = [];
            for( let [ key, arr ] of data.attributesData.entries() ){
                  vertexBuffers.push( this.createBuffer({
                        data: arr,
                  }) );
            }
            if( !opt.indices ){
                  opt.indices = [];
                  for( let i = 0; i < opt.vertices.length/3; i++ )
                        opt.indices.push(i);
            }
            const indexBuffer = this.createBuffer({
                  data: opt.indices,
                  dataType: BufferDataType.uint16,
                  usage: BufferUsage.index,
            })
            const primitive = this.getPrimitive( Primitives.triangles );
            const N_OF_VERTICES = opt.indices.length;
            return ()=>{
                  for( let buffer of vertexBuffers )
                        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, buffer );
                  this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer );
                  this.gl.drawElements( primitive, N_OF_VERTICES, this.gl.UNSIGNED_SHORT, 0);
            }
      }
      append( func: RenderFunction ): void {
            this.functions.push( func );
      }
      remove( ){}
      draw(): void {
      }
}
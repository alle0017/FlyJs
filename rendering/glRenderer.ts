import { WebGL } from './codeDelegates/GLcode.js';
import { DrawableElementAttributes, RenderFunction, ProgramMode, BufferDataType, BufferUsage, Primitives, RendererErrorType } from './types.js';
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";

export class Renderer extends WebGL { 

      protected functions: RenderFunction[] = [];
      protected renderPassDescriptor?: GPURenderPassDescriptor;

      
      async init(): Promise<this> {
            this.gl.enable( this.gl.DEPTH_TEST );
            this.gl.depthFunc( this.gl.LESS );
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
            const vertexBuffers: Map<string,WebGLBuffer> = new Map<string,WebGLBuffer>();
            for( let [ key, arr ] of data.attributesData.entries() ){
                  vertexBuffers.set( key, this.createBuffer({
                        data: arr,
                  }) );
                  if( data.attributes.has( key ) )
                        data.attributes.get( key )!.shaderLocation = this.gl.getAttribLocation( program, key );
                  else 
                        this.error( `buffer ${key}`, RendererErrorType.initialization );
            }
            const count = this.getPrimitivesVertexCount( Primitives.triangles );
            if( !opt.indices ){
                  opt.indices = [];
                  for( let i = 0; i < opt.vertices.length/count; i++ )
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
                  this.gl.useProgram( program );
                  for( let [ key, buffer ] of vertexBuffers.entries() ){
                        const bufferData = data.attributes.get( key )!;
                        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, buffer );
                        this.gl.vertexAttribPointer( 
                              bufferData.shaderLocation, 
                              bufferData.components,
                              this.gl.FLOAT,
                              false, 0, 0 );
                        this.gl.enableVertexAttribArray( bufferData.shaderLocation )
                  }
                  this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer );
                  this.gl.drawElements( primitive, N_OF_VERTICES, this.gl.UNSIGNED_SHORT, 0);
            }
      }
      append( func: RenderFunction ): void {
            this.functions.push( func );
      }
      remove( ){}
      draw(): void {
            for( let func of this.functions ){
                  (func as ()=>void)();
            }
      }
}
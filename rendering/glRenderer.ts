import { WebGL } from './codeDelegates/GLcode.js';
import { 
      DrawableElementAttributes, 
      RenderFunction, 
      ProgramMode, 
      BufferDataType, 
      BufferUsage, 
      Primitives, 
      RendererErrorType,
      BufferData,
      DrawOpt,
      Renderable,
      GPUCodeProperties,
 } from './types.js';
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { UniformsName as UN } from './shaders/shaderModel.js';
import { ViewDelegate } from './matrix/viewMatrix.js';

type UniformsData = {
      [ T in UN ]: number[] | number; 
}
type WebGLRenderFunctionData = {
      N_OF_VERTICES: number,
      program: WebGLProgram,
      vertexBuffers: Map<string,WebGLBuffer>,
      attributes: Map<string, BufferData>,
      locations:  Map<string, WebGLUniformLocation>,
      uniforms: Map<string, BufferData>,
      primitive: number,
      indexBuffer: WebGLBuffer,
      objOpt: DrawableElementAttributes,
}
export class Renderer extends WebGL { 

      protected objects: Map<string,Renderable> = new Map<string,Renderable>();
      protected renderPassDescriptor?: GPURenderPassDescriptor;
      private view: ViewDelegate;

      constructor( cvs: HTMLCanvasElement ){
            super( cvs );
            this.view = new ViewDelegate( cvs.width/cvs.height );
      }
      async init(): Promise<this> {
            this.gl.enable( this.gl.DEPTH_TEST );
            this.gl.depthFunc( this.gl.LESS );
            return this;
      }
      private createRenderFunction( opt: WebGLRenderFunctionData ): RenderFunction {
            const defaultRenderFunc = () =>{
                  for( let [ key, buffer ] of opt.vertexBuffers.entries() ){
                        const bufferData = opt.attributes.get( key )!;
                        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, buffer );
                        this.gl.vertexAttribPointer( 
                              bufferData.shaderLocation, 
                              bufferData.components,
                              this.gl.FLOAT,
                              false, 0, 0 );
                        this.gl.enableVertexAttribArray( bufferData.shaderLocation );
                  }
                  this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, opt.indexBuffer );
                  this.gl.drawElements( opt.primitive, opt.N_OF_VERTICES, this.gl.UNSIGNED_SHORT, 0);
            }
            if( opt.locations.size <= 0 )
                  return ( drawOpt?: DrawOpt )=>{
                        this.gl.useProgram( opt.program );
                        defaultRenderFunc();
                  }
            const uniforms = ( drawOpt?: DrawOpt )=>{
                  const uniformsData = this.getUniformsData( drawOpt, opt.objOpt );
                  for( let [key, value] of opt.locations.entries() ){
                        const bufferData = opt.uniforms.get( key );
                        if( bufferData && uniformsData[key as UN] )
                              this.setUniforms( bufferData , value, uniformsData[key as UN]! );
                  }
            }
            return ( drawOpt?: DrawOpt )=>{
                  this.gl.useProgram( opt.program );
                  uniforms( drawOpt );
                  defaultRenderFunc();
            }
      }
      private setUniforms( data: BufferData, location: WebGLUniformLocation, value: number | number[] ): void {
            const type = data.dataType;
            switch ( type ) {
                  case 'vec4': 
                        this.gl.uniform4fv( location, value as number[] );
                  break;
                  case 'vec3':
                        this.gl.uniform3fv( location, value as number[] );
                   break;
                  case 'vec2': 
                        this.gl.uniform2fv( location, value as number[] );
                  break;
                  case 'int': 
                        this.gl.uniform1i( location, value as number );
                  break;
                  case 'float': 
                        this.gl.uniform1f( location, value as number );
                  break;
                  case  'mat4': 
                        this.gl.uniformMatrix4fv( location, false, value as number[] );
                  break;
                  case 'mat3': 
                        this.gl.uniformMatrix3fv( location, false, value as number[] );
                  break;
                  case 'mat2': 
                        this.gl.uniformMatrix2fv( location, false, value as number[] );break;
                  case 'mat3x2': break;
                  default: break;
            }
      } 
      private getUniformsData( opt: DrawOpt | undefined, elementAttr: DrawableElementAttributes ): Partial<UniformsData> {
            const obj: Partial<UniformsData> = {};
            if( elementAttr.perspective ){
                  obj[UN.perspective] = this.view.perspectiveMatrix;
            }
            if( !elementAttr.static ){
                  obj[UN.transformation] = this.view.getTransformationMatrix( opt );
            }
            if( !elementAttr.imageData ) return obj;
            if( elementAttr.imageData.animate ){
                  obj[UN.framePosition] = opt?.animationVector || [ 0, 0 ];
            }
            if( elementAttr.imageData.displacementMap ){
                  obj[UN.bumpScale] = opt?.bumpScale || 1;
            }
            return obj;
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
            if( !opt.indices ){
                  const count = this.getPrimitivesVertexCount( Primitives.triangles );
                  opt.indices = [];
                  for( let i = 0; i < opt.vertices.length/count; i++ )
                        opt.indices.push(i);
            }
            const indexBuffer = this.createBuffer({
                  data: opt.indices,
                  dataType: BufferDataType.uint16,
                  usage: BufferUsage.index,
            })
            const locations: Map<string,WebGLUniformLocation> = new Map<string,WebGLUniformLocation>();
            for( const key of data.uniforms.keys() ){
                  const loc = this.gl.getUniformLocation( program, key ) as WebGLUniformLocation;
                  if( !loc )
                        this.error( 'uniform location',RendererErrorType.acquisition );
                  locations.set( key, loc );
            }
            const primitive = this.getPrimitive( Primitives.triangles );
            const N_OF_VERTICES = opt.indices.length;

            return this.createRenderFunction({
                  N_OF_VERTICES,
                  program,
                  vertexBuffers,
                  attributes: data.attributes,
                  locations,
                  uniforms: data.uniforms,
                  primitive,
                  indexBuffer,
                  objOpt: opt
            });
            /*return ( drawOpt?: DrawOpt )=>{
                  
                  this.gl.useProgram( program );
                  for( let [ key, buffer ] of vertexBuffers.entries() ){
                        const bufferData = data.attributes.get( key )!;
                        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, buffer );
                        this.gl.vertexAttribPointer( 
                              bufferData.shaderLocation, 
                              bufferData.components,
                              this.gl.FLOAT,
                              false, 0, 0 );
                        this.gl.enableVertexAttribArray( bufferData.shaderLocation );
                  }
                  if( locations.size > 0 ){
                        const uniformsData = this.getUniformsData( drawOpt, opt );
                        for( let [key, value] of locations.entries() ){
                              const bufferData = data.uniforms.get( key );
                              if( bufferData && uniformsData[key as UN] )
                                    this.setUniforms( bufferData , value, uniformsData[key as UN]! );
                        }
                  }
                  this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer );
                  this.gl.drawElements( primitive, N_OF_VERTICES, this.gl.UNSIGNED_SHORT, 0);
            }*/
      }
      append( name: string, func: RenderFunction ): this {
            this.objects.set( name, {
                  function: func,
                  attributes: {}
            });
            return this;
      }
      remove( name: string ): RenderFunction | undefined {
            if( !this.objects.has( name ) ){
                  console.warn(`object ${name} does not exist`);
                  return;
            }
            const func = this.objects.get( name )?.function;
            this.objects.delete( name );
            return func;
      }
      setAttributes( name: string, opt: DrawOpt ): this {
            if( !this.objects.has( name ) ){
                  console.warn(`object ${name} does not exist`);
                  return this;
            }
            this.objects.get( name )!.attributes  = {
                  ...this.objects.get( name )!.attributes,
                  ...opt
            }
            return this;
      }
      draw(): void {
            for( let el of this.objects.values() ){
                  (el.function as ( arg0: DrawOpt )=>void)( el.attributes );
            }
      }
}
/*import { WebGL } from './codeDelegates/GLcode.js';
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
      Color,
      DrawableImageOptions,
 } from './types.js';
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { UniformsName as UN, BindingsName as BN } from './shaders/shaderModel.js';
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
      textures: Map<BN, WebGLTexture>;
}
type AcceptedNumbers = 
0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 
| 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 
21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31
type TextureAttributeName = `TEXTURE${AcceptedNumbers}`;
export class Renderer extends WebGL { 

      protected objects: Map<string,Renderable> = new Map<string,Renderable>();
      protected renderPassDescriptor?: GPURenderPassDescriptor;
      private view: ViewDelegate;

      private _clearColor: Color = { r: 0, g: 0, b: 0, a: 1 };

      private _culling: boolean = false;

      get culling(): boolean {
            return this._culling;
      }
      set culling( value: boolean ){
            if( value === this._culling )
                  return;
            if( value ){
                  this.gl.enable( this.gl.CULL_FACE );
                  this.gl.cullFace( this.gl.FRONT_AND_BACK );
            }else{
                  this.gl.disable( this.gl.CULL_FACE );
            }
      }
      get clearColor(): Color {
            return this._clearColor;
      }
      set clearColor( value: Color ){
            if( 
                  this._clearColor.r === value.r || 
                  this._clearColor.g === value.g ||
                  this._clearColor.b === value.b || 
                  this._clearColor.a === value.a
                  ) return;
            this._clearColor = value;
            this.gl.clearColor( value.r, value.g, value.b, value.a );
      }

      constructor( cvs: HTMLCanvasElement ){
            super( cvs );
            this.view = new ViewDelegate( cvs.width/cvs.height );
      }
      async init(): Promise<this> {
            this.gl.enable( this.gl.DEPTH_TEST );
            this.gl.depthFunc( this.gl.LESS );
            return this;
      }
      private setIndexArray( vertices: number, primitive: Primitives ): number[]{
            const count = this.getPrimitivesVertexCount( primitive );
            const indices: number[] = [];
            for( let i = 0; i < vertices/count; i++ )
                  indices.push(i);
            return indices;
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
                  let i = 0;
                  for( let [key, value] of opt.locations.entries() ){
                        const bufferData = opt.uniforms.get( key );
                        const texture = key in BN? opt.textures.get( key as BN ): undefined;
                        if( bufferData && uniformsData[key as UN] )
                              this.setUniforms( bufferData , value, uniformsData[key as UN]! );
                        else if( texture && `TEXTURE${i}` in this.gl ){
                              this.gl.uniform1i( value , i );
                              this.gl.activeTexture( this.gl[ `TEXTURE${i}` as TextureAttributeName ] );
                              this.gl.bindTexture(this.gl.TEXTURE_2D, texture );
                              i++;
                        }
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
      private createTexture( name: BN, opt: DrawableImageOptions ): WebGLTexture {
            let img: ImageBitmap;
            if( name === BN.displacementMap && opt.displacementMap )
                  img = opt.displacementMap;
            else if( name === BN.texture )
                  img = opt.image;
            else{
                  this.error( `texture (${name} for texture is not defined in WebGL)`, RendererErrorType.creation );
            }
            const texture = this.gl.createTexture() as WebGLTexture;
            if( !texture )
                  this.error( 'texture', RendererErrorType.creation );
            
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

            this.gl.texImage2D( 
                  this.gl.TEXTURE_2D, 
                  0, 
                  this.gl.RGBA, 
                  this.gl.RGBA, 
                  this.gl.UNSIGNED_BYTE, 
                  img! as ImageBitmap
            );
            return texture;
      }
      private createVertexBuffers( program: WebGLProgram, vertexBuffers: Map<string, WebGLBuffer>, attributes: Map<string, BufferData>, attributesData: Map<string, number[]>  ){
            for( let [ key, arr ] of attributesData.entries() ){
                  vertexBuffers.set( key, this.createBuffer({
                        data: arr,
                  }) );
                  if( attributes.has( key ) )
                        attributes.get( key )!.shaderLocation = this.gl.getAttribLocation( program, key );
                  else 
                        this.error( `buffer ${key}`, RendererErrorType.initialization );
            }
      }
      private setUniformsLocations( 
            program: WebGLProgram, 
            uniforms: Map<string, BufferData>, 
            locations: Map<string,WebGLUniformLocation>, 
            imageData?: DrawableImageOptions ): Map<BN, WebGLTexture>{

            const textures: Map<BN, WebGLTexture> = new Map<BN, WebGLTexture>();
            for( const key of uniforms.keys() ){
                  const loc = this.gl.getUniformLocation( program, key ) as WebGLUniformLocation;
                  if( !loc )
                        this.error( 'uniform location',RendererErrorType.acquisition );
                  locations.set( key, loc );
                  if( key in BN && imageData && key !== BN.bones ){ // enums generates also values as key
                        textures.set(
                              key as BN,
                              this.createTexture( key as BN, imageData )
                        )
                  }else if( key === BN.bones ){
                        //TODO: put bones code here
                  }
            }
            return textures;
      }

      private setProgramAttributes( opt: DrawableElementAttributes ){
            const data = ProgramSetterDelegate.getProperties( opt, ProgramMode.webgl, false );
            const program = this.createProgram( {
                  vShader: data.vertex,
                  fShader: data.fragment,
                  buffers: [],
                  stride: 0,
            });
            const vertexBuffers: Map<string,WebGLBuffer> = new Map<string,WebGLBuffer>();
            this.createVertexBuffers( 
                  program, 
                  vertexBuffers,
                  data.attributes,
                  data.attributesData
            );
            if( !opt.indices ){
                  opt.indices = this.setIndexArray( 
                        opt.vertices.length, 
                        opt.primitive || Primitives.triangles
                  )
            }
            const indexBuffer = this.createBuffer({
                  data: opt.indices,
                  dataType: BufferDataType.uint16,
                  usage: BufferUsage.index,
            })
            const locations: Map<string,WebGLUniformLocation> = new Map<string,WebGLUniformLocation>();
            const textures: Map<BN, WebGLTexture> = this.setUniformsLocations( program, data.uniforms, locations, opt.imageData );
            const primitive = this.getPrimitive( Primitives.triangles );
            const N_OF_VERTICES = opt.indices.length;
            return {
                  N_OF_VERTICES,
                  program,
                  vertexBuffers,
                  attributes: data.attributes,
                  locations,
                  uniforms: data.uniforms,
                  primitive,
                  indexBuffer,
                  textures
            }
      }
      create( opt: DrawableElementAttributes ): RenderFunction {
            return this.createRenderFunction({
                  ...this.setProgramAttributes( opt ),
                  objOpt: opt,
            });
      }
      /*append( name: string, func: RenderFunction ): this {
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
      setToAll( attributes: DrawOpt ): this {
            for( let el of this.objects.keys() ){
                  this.setAttributes( el, attributes );
            }
            return this;
      }
      draw(): void {
            for( let el of this.objects.values() ){
                  (el.function as ( arg0: DrawOpt )=>void)( el.attributes );
            }
      }
}*/
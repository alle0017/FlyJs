import { WebGL } from './codeDelegates/GLcode.js';
import { 
      DrawableElementAttributes, 
      RenderFunction, 
      ProgramMode, 
      Primitives, 
      RendererErrorType,
      BufferData,
      DrawOpt,
      WebGLRenderable,
      Color,
      DrawableImageOptions,
      Skeleton,
      Bone,
      BufferUsage,
      BufferDataType,
      AttribsInfo,
      UniformsInfo
 } from './types.js';
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { UniformsName as UN, BindingsName as BN } from './shaders/shaderModel.js';
import { ViewDelegate } from './matrix/viewMatrix.js';
import { Matrix } from './matrix/matrices.js';

type UniformsData = {
      [ T in UN ]: number[] | number; 
} & { [BN.bones]: number[] }; 
type WebGLRenderFunctionData = {
      N_OF_VERTICES: number,
      program: WebGLProgram,
      uniforms: Map<string, UniformsInfo>,
      primitive: number,
      indexBuffer: WebGLBuffer,
      textures: Map<string, WebGLTexture>,
      attribs: Map<string, AttribsInfo>,
}

type AcceptedNumbers = 
0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 
| 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 
21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31
type TextureAttributeName = `TEXTURE${AcceptedNumbers}`;
export class WebGLRenderer extends WebGL { 

      protected objects: Map<string,WebGLRenderable> = new Map<string,WebGLRenderable>();
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
      
      private setUniforms( data: UniformsInfo ): void {
            switch ( data.type ) {
                  case 'vec4': 
                        this.gl.uniform4fv( data.location, data.value as number[] );
                  break;
                  case 'vec3':
                        this.gl.uniform3fv( data.location, data.value as number[] );
                   break;
                  case 'vec2': 
                        this.gl.uniform2fv( data.location, data.value as number[] );
                  break;
                  case 'int': 
                        this.gl.uniform1i( data.location, data.value as number );
                  break;
                  case 'float': 
                        this.gl.uniform1f( data.location, data.value as number );
                  break;
                  case  'mat4': 
                        this.gl.uniformMatrix4fv( data.location, false, data.value as number[] );
                  break;
                  case 'mat3': 
                        this.gl.uniformMatrix3fv( data.location, false, data.value as number[] );
                  break;
                  case 'mat2': 
                        this.gl.uniformMatrix2fv( data.location, false, data.value as number[] );break;
                  case 'mat3x2': break;
                  default: break;
            }
      } 
      private getUniformsData( bones: Skeleton, opt: DrawOpt | undefined, elementAttr: DrawableElementAttributes ): Partial<UniformsData> {
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
            if( opt?.bones ){

                  if( !opt.bones.translate ){
                        opt.bones.translate = []
                        for( let i = 0; i < opt.bones.angle!.length; i++ )
                              opt.bones.translate.push({ x: 0, y: 0, z: 0})
                  }else if( !opt.bones.angle ){
                        opt.bones.angle = []
                        for( let i = 0; i < opt.bones.translate.length; i++ )
                              opt.bones.angle.push(0);
                  }
                  const bonesMatrices = this.view.calculateSkeletonPosition( bones, opt.bones.angle!, opt.bones.translate );
                  obj[BN.bones] = [];
                  obj[BN.bones].push( ...bonesMatrices.reduce( (prev, curr)=> prev? prev.concat( curr ): curr ) );
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
      private isTexture( type: string ): boolean {
            return type === 'sampler2D';
      }
      private setTextures( uniforms: Map<string,UniformsInfo>, opt: DrawableImageOptions | undefined ): Map<string, WebGLTexture> {
            const textures = new Map<string, WebGLTexture>();
            if( !opt ) return textures;

            for( let [ name, data ] of uniforms ){
                  if( this.isTexture( data.type ) )
                        textures.set( 
                              name,
                              this.createTexture( name as BN, opt )
                        );
            }
            return textures;
      }
      private setUniformsLocations( program: WebGLProgram, uniforms: Map<string, BufferData> ): Map<string,UniformsInfo> {
            const uniformsData: Map<string,UniformsInfo> = new Map<string,UniformsInfo>();
            for( let [ name, data ] of uniforms ){
                  uniformsData.set( name, {
                        location: this.gl.getUniformLocation( program, name ) as WebGLUniformLocation,
                        components: data.components,
                        type: data.dataType,
                        value: []
                  })
            }
            return uniformsData;
      }
      private setAttributesData( program: WebGLProgram, attribsData: Map<string, number[]>, nAttribsComponents: Map<string, BufferData> ){
            const attribs = new Map<string, AttribsInfo>();
            for( const [ name, data ] of attribsData.entries() ){
                  const components = nAttribsComponents.get( name )?.components || 0;
                  attribs.set( name, {
                        buffer: this.createBuffer({ data }),
                        location: this.gl.getAttribLocation( program, name ),
                        components,
                  })
            }
            return attribs;
      }
      private setProgramAttributes( opt: DrawableElementAttributes ){
            const data = ProgramSetterDelegate.getProperties( opt, ProgramMode.webgl );

            const program = this.createProgram({
                  vShader: data.vertex,
                  fShader: data.fragment,
                  buffers: [],
                  stride: 0,
            });
            if( !opt.indices )
                  opt.indices = this.setIndexArray( 
                        opt.vertices.length , 
                        opt.primitive || Primitives.triangles
                  );
            
            const N_OF_VERTICES = opt.indices.length;
            const attribs = this.setAttributesData( program, data.attributesData, data.attributes );
            const indexBuffer = this.createBuffer({
                  data: opt.indices,
                  dataType: BufferDataType.uint16,
                  usage: BufferUsage.index,
            });
            const uniforms = this.setUniformsLocations( program, data.uniforms );
            const textures = this.setTextures( uniforms, opt.imageData );
            const primitive = this.getPrimitive( opt.primitive || Primitives.triangles );
            return {
                  uniforms,
                  textures, 
                  indexBuffer,
                  attribs,
                  N_OF_VERTICES,
                  program,
                  primitive
            }
      }
      private initArrays( uniforms: Map<string, UniformsInfo>, opt: DrawableElementAttributes ): Skeleton {
            const bones: Bone[] = [];
            const setters = {
                  [BN.bones]: ()=>{
                        if( !opt.bonesData ){
                              this.error( 'uniform buffer (no bones data set)', RendererErrorType.initialization );
                              return;
                        }
                        uniforms.get(BN.bones)!.value = [];
                        for( let i = 0; i < opt.bonesData.bones; i++ ){
                              ( uniforms.get(BN.bones)!.value as number[] ).push( ...Matrix.IDENTITY_4X4 );
                              bones.push({
                                    inversePose: Matrix.IDENTITY_4X4,
                                    transformationMatrix: Matrix.IDENTITY_4X4
                              })
                        }
                  },
                  [UN.framePosition]: ()=>{
                        uniforms.get(UN.framePosition)!.value = [ 0, 0 ]
                  },
                  [UN.bumpScale]: ()=>{
                        uniforms.get(UN.bumpScale)!.value = 1;
                  },
                  [UN.perspective]: ()=>{
                        uniforms.get(UN.perspective)!.value = Matrix.IDENTITY_4X4;
                  },
                  [UN.transformation]: ()=>{
                        uniforms.get(UN.transformation)!.value = Matrix.IDENTITY_4X4;
                  }
            }
            for( let name of uniforms.keys() ){
                  if( name in setters )
                        setters[ name as UN ]();
            }
            return {
                  bones,
                  root: ( opt.bonesData && opt.bonesData.root )? opt.bonesData.root : 0,
                  indices: ( opt.bonesData && opt.bonesData.indices )? opt.bonesData.indices : []
            }
      }
      private setSkeleton( bones: Skeleton, opt: DrawOpt ): number[] {
            const bonesArray: number[] = [];
            if( !opt.bones || ( !opt.bones.angle && !opt.bones.translate ) ) return [];
            if( !opt.bones.translate ){
                  opt.bones.translate = []
                  for( let i = 0; i < opt.bones.angle!.length; i++ )
                        opt.bones.translate.push({ x: 0, y: 0, z: 0})
            }else if( !opt.bones.angle ){
                  opt.bones.angle = []
                  for( let i = 0; i < opt.bones.translate.length; i++ )
                        opt.bones.angle.push(0);
            }
            const bonesMatrices = this.view.calculateSkeletonPosition( bones, opt.bones.angle!, opt.bones.translate );
            bonesArray.push( ...bonesMatrices.reduce( (prev, curr)=> prev? prev.concat( curr ): curr ) );
            return bonesArray;
      }
      private setUniformsArrays( obj: WebGLRenderable ){
            const setters = {
                  [UN.perspective]: ()=>{
                        const perspective = obj.uniforms.get(UN.perspective);
                        if( !perspective ){
                              console.warn( 'no perspective matrix set' );
                              return;
                        }
                        perspective.value = this.view.perspectiveMatrix;
                  },
                  [UN.transformation]: ()=>{
                        const transformation = obj.uniforms.get(UN.transformation);
                        if( !transformation ){
                              console.warn( 'object set as static' );
                              return;
                        }
                        transformation.value = this.view.getTransformationMatrix( obj.attributes );
                  },
                  [UN.bumpScale]: ()=>{
                        const bumpScale = obj.uniforms.get(UN.bumpScale);
                        if( !bumpScale ){
                              console.warn( 'no bump map set' );
                              return;
                        }
                        bumpScale.value = obj.attributes?.bumpScale || 1;
                  },
                  [UN.framePosition]: ()=>{
                        const animationVec = obj.uniforms.get(UN.bumpScale);
                        if( !animationVec ){
                              console.warn( 'cannot use animation' );
                              return;
                        }
                        animationVec.value = obj.attributes?.animationVector || [ 0, 0 ];
                  },
                  [ BN.bones ]: ()=>{
                        const bonesMat = obj.uniforms.get( BN.bones );
                        if( !bonesMat ){
                              console.warn( 'no skeletal animation set' );
                              return;
                        }
                        bonesMat.value = this.setSkeleton( obj.skeleton, obj.attributes );
                  }
            };
            console.log( obj.uniforms )
            for( let name of obj.uniforms.keys() ){
                  if( name in setters )
                        setters[ name as UN ]();
            }
      }
      private createRenderFunction( opt: WebGLRenderFunctionData ): RenderFunction {
            const attribSetter = ()=>{
                  for( let data of opt.attribs.values() ){
                        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, data.buffer );
                        this.gl.vertexAttribPointer( 
                              data.location, 
                              data.components,
                              this.gl.FLOAT,
                              false, 0, 0 );
                        this.gl.enableVertexAttribArray( data.location );
                  }
            }
            const draw = ()=>{
                  this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, opt.indexBuffer );
                  this.gl.drawElements( opt.primitive, opt.N_OF_VERTICES, this.gl.UNSIGNED_SHORT, 0 );
            }
            if( opt.uniforms.size <= 0 )
            return ()=>{
                  this.gl.useProgram( opt.program );
                  attribSetter();
                  draw();
            }
            const uniformSetter = ()=>{
                  let bindGroup = 0;
                  for( let [ name, data ] of opt.uniforms.entries() ){
                        const texture = opt.textures.get( name );
                        if( texture ){
                              this.gl.uniform1i( data.location, bindGroup );
                              this.gl.activeTexture( this.gl[ `TEXTURE${bindGroup}` as TextureAttributeName ] );
                              this.gl.bindTexture(this.gl.TEXTURE_2D, texture );
                              bindGroup++;
                              if( bindGroup > 31 ){
                                    console.error( 'to many images were passed' );
                              }
                              continue;
                        }
                        this.setUniforms( data );
                        
                  }
            }
            return ()=>{
                  this.gl.useProgram( opt.program );
                  uniformSetter();
                  attribSetter();
                  draw();
            }
      }
      
      create( opt: DrawableElementAttributes ): WebGLRenderable {
            const programInfos = this.setProgramAttributes( opt );
            const skeleton = this.initArrays( programInfos.uniforms, opt );
            return {
                  function: this.createRenderFunction( programInfos ),
                  skeleton,
                  uniforms: programInfos.uniforms,
                  attributes: {},
            }
      }
      append( name: string, obj: WebGLRenderable ): this {
            this.objects.set( name, obj );
            this.setAttributes( name, {} );
            return this;
      }
      remove( name: string ): WebGLRenderable | undefined {
            if( !this.objects.has( name ) ){
                  console.warn(`object ${name} does not exist`);
                  return;
            }
            const obj = this.objects.get( name );
            this.objects.delete( name );
            return obj;
      }
      removeAll(): void {
            this.objects.clear();
      }
      setAttributes( name: string, opt: DrawOpt ): this {
            const obj = this.objects.get( name );
            if( !obj ){
                  console.warn(`object ${name} does not exist`);
                  return this;
            }
            obj.attributes  = {
                  ...obj.attributes,
                  ...opt
            }
            this.setUniformsArrays( obj )
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
}
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
      UniformsInfo,
      PerspectiveOpt,
      Point3D,
 } from './types.js';
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { UniformsName as UN, BindingsName as BN } from './shaders/shaderModel.js';
import { ViewDelegate } from './matrix/viewMatrix.js';
import { Matrix } from './matrix/matrices.js';
import { Shapes } from './shapes.js';

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
      private transparency: boolean = false;

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
      get perspectiveCoords(): PerspectiveOpt {
            return {
                  fieldOfView: this.view.fieldOfView,
                  near: this.view.zNear,
                  far: this.view.zFar,
            }
      }
      set perspectiveCoords( opt: Partial<PerspectiveOpt> ){
            if( opt.far )
                  this.view.zFar = opt.far;
            if( opt.near )
                  this.view.zNear = opt.near;
            if( opt.fieldOfView )
                  this.view.fieldOfView = opt.fieldOfView;
      }

      constructor( private cvs: HTMLCanvasElement ){
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
            this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            //console.log( this.gl.getParameter( this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL ) );
            this.gl.texImage2D( 
                  this.gl.TEXTURE_2D, 
                  0, 
                  this.gl.RGBA, 
                  this.gl.RGBA, 
                  this.gl.UNSIGNED_BYTE, 
                  img! as ImageBitmap
            );
            

            
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            
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
            //object that maps the setter functions, used to set the arrays,
            // with the name of the uniform
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
                        const animationVec = obj.uniforms.get(UN.framePosition);
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
            for( let name of obj.uniforms.keys() ){
                  if( name in setters )
                        setters[ name as UN ]();
            }
      }
      private createRenderFunction( opt: WebGLRenderFunctionData ): RenderFunction {
            // default render function executed always
            const attribSetter = ()=>{
                  for( let data of opt.attribs.values() ){
                        //bind all the attributes buffer
                        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, data.buffer );
                        this.gl.vertexAttribPointer( 
                              data.location, 
                              data.components,
                              this.gl.FLOAT,
                              false, 0, 0 );
                        //enable the buffer
                        this.gl.enableVertexAttribArray( data.location );
                  }
            }
            // draw function always executed
            const draw = ()=>{
                  this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, opt.indexBuffer );
                  this.gl.drawElements( opt.primitive, opt.N_OF_VERTICES, this.gl.UNSIGNED_SHORT, 0 );
            }
            // check if any uniforms exists
            if( opt.uniforms.size <= 0 )
            return ()=>{
                  //link the program
                  this.gl.useProgram( opt.program );
                  //set the attributes buffers
                  attribSetter();
                  draw();
            }
            const uniformSetter = ()=>{
                  //bind group for images
                  let bindGroup = 0;
                  for( let [ name, data ] of opt.uniforms.entries() ){
                        //code executed only if the uniform is a texture
                        const texture = opt.textures.get( name );
                        if( texture ){
                              //set the image at currently available bind group
                              this.gl.uniform1i( data.location, bindGroup );
                              //bind the texture
                              this.gl.activeTexture( this.gl[ `TEXTURE${bindGroup}` as TextureAttributeName ] );
                              this.gl.bindTexture(this.gl.TEXTURE_2D, texture );
                              bindGroup++;
                              //31 is the maximum binding size
                              if( bindGroup > 31 ){
                                    console.error( 'to many images were passed' );
                              }
                              continue;
                        }
                        //else set the uniform array
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
      private getMinZ( vertices: number[] ){
            let z = vertices[2]
            for( let i = 2; i < vertices.length; i+=3 ){
                  if( vertices[i] < z )
                        z = vertices[i]
            }
            return z;
      }
      create( opt: DrawableElementAttributes ): WebGLRenderable {
            // get the program attributes based on the attributes passed
            const programInfos = this.setProgramAttributes( opt );
            //initialize the uniform arrays and get the skeleton object
            const skeleton = this.initArrays( programInfos.uniforms, opt );
            return {
                  function: this.createRenderFunction( programInfos ),
                  skeleton,
                  uniforms: programInfos.uniforms,
                  attributes: {},
                  transparent: opt.imageData? true: false,
                  z: this.getMinZ( opt.vertices ),
                  extremes: Shapes.getExtremes( opt.vertices ),
            }
      }
      append( name: string, obj: WebGLRenderable ): this {
            this.objects.set( name, obj );
            this.setAttributes( name, obj.attributes );
            if( obj.transparent ){
                  this.transparency = true;
                  this.gl.enable( this.gl.BLEND )
                  this.gl.blendFunc( this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA );
            }
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
            this.transparency = false;
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
      private sortTransparent(): WebGLRenderable[] {
            const sorted: WebGLRenderable[] = [];
            const others: WebGLRenderable[] = [];
            if( !this.transparency ){
                  return [...this.objects.values()];
            }
            for( let el of this.objects.values() ){
                  if( !el.transparent ){
                        others.push( el );
                        continue;
                  }
                  let i;
                  // second-last element is the 15th element
                  const zTranslationTested = el.attributes.translationMatrix? el.attributes.translationMatrix![14]: 0;
                  for( i = 0; i < sorted.length ; i++ ){
                        // second-last element is the 15th element
                        // values to switch with
                        const zTranslationTemp = sorted[i].attributes.translationMatrix? sorted[i].attributes.translationMatrix![14]: 0;
                        if( sorted[i].z + zTranslationTemp > el.z + zTranslationTested ){
                              break;
                        }
                  }
                  sorted.splice( i , 0, el );
            }
            return [ ...others, ...sorted ];
      }
      private getTranslation( el: WebGLRenderable ){
            const point = {
                  x: 0,
                  y: 0,
                  z: 0
            }
            if( el.attributes.translationMatrix ){
                  point.x += el.attributes.translationMatrix[12]
                  point.y += el.attributes.translationMatrix[13]
                  point.z += el.attributes.translationMatrix[14]
            }
            if( el.attributes.camera ){
                  point.x -= el.attributes.camera.x;
                  point.y -= el.attributes.camera.y;
                  point.z -= el.attributes.camera.z;
            }
            return point;
      }
      private isOnScreen( el: WebGLRenderable ): boolean {
            const translation = this.getTranslation(el);
            const max = {
                  x: el.extremes.max.x + translation.x,
                  y: el.extremes.max.y + translation.y,
                  z: el.extremes.max.z + translation.z,
            }
            const min = {
                  x: el.extremes.min.x + translation.x,
                  y: el.extremes.min.y + translation.y,
                  z: el.extremes.min.z + translation.z,
            }
            const pointOnScreen = ( point: Point3D)=>{
                  return ( 
                        point.x > -1 &&
                        point.y > -1 &&
                        point.y < 1 &&
                        point.x < 1 &&
                        point.z < this.view.zNear &&
                        point.z > -(this.view.zFar - 1)
                  )
            }
            return (
                  (     pointOnScreen(max) && 
                        pointOnScreen(min) ) || 
                  pointOnScreen({
                        x: (max.x + min.x )/ 2,
                        y: (max.y + min.y)/2,
                        z: (max.z + min.z)/2
                  }) 
            );
      }
      draw(): void {
            //sort the objects for transparency
            const sortedObj = this.sortTransparent();
            // draw each object
            for( let el of sortedObj ){
                  if( this.isOnScreen( el ) )
                  (el.function as ( arg0: DrawOpt )=>void)( el.attributes );
            }
      }
}

import { WebGPU, Resources } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import { UniformsName as UN, BindingsName as BN } from './shaders/shaderModel.js';
import { UNIFORM } from "./shaders/GPUShader.js";
import { 
      DrawableElementAttributes,
      ProgramMode, 
      BufferDataType, 
      BufferUsage, 
      Primitives, 
      RendererErrorType,
      DrawOpt,
      DrawableImageOptions,
      Renderable,
      RenderableArrays,
      Skeleton,
      Bone
 } from './types.js';
import { Matrix } from "./matrix/matrices.js";
import { UniformsName } from './shaders/shaderModel';

type UniformInformation = { 
      buffer: GPUBuffer | undefined, 
      bindGroup: GPUBindGroup, 
      boneBuffer: GPUBuffer | undefined,
} 
type WebGPURenderFunctionData = {
      pipeline: GPURenderPipeline,
      vertexBuffer: GPUBuffer,
      N_OF_VERTICES: number,
      indexBuffer: GPUBuffer,
      uniforms?: UniformInformation,
}
type UniformsSetterFunction = {
      [ T in UN ]: ()=>void;
};

export class WebGPURenderer extends WebGPU {
      protected objects: Map<string,Renderable> = new Map<string,Renderable>();
      protected renderPassDescriptor?: GPURenderPassDescriptor;
      private view: ViewDelegate;

      constructor( cvs: HTMLCanvasElement ){
            super( cvs );
            this.view = new ViewDelegate( this.cvs.width/this.cvs.height );
      }

      override async init(): Promise<this> {
            await super.init();
            this.renderPassDescriptor = this.createRenderPassDescriptor( true );
            return this;
      }
      private setIndexArray( vertices: number, primitive: Primitives ): number[]{
            const count = this.getPrimitivesVertexCount( primitive );
            const indices: number[] = [];
            for( let i = 0; i < vertices/count; i++ )
                  indices.push(i);
            return indices;
      }
      private createRenderFunction( opt: WebGPURenderFunctionData ) {
            const defaultRenderFunc = ( pass: GPURenderPassEncoder )=>{
                  pass.setIndexBuffer( opt.indexBuffer, 'uint16' );
                  pass.setVertexBuffer( 0, opt.vertexBuffer );
                  pass.drawIndexed( opt.N_OF_VERTICES )
            }
            if( !opt.uniforms )
                  return ( arrays: RenderableArrays , pass: GPURenderPassEncoder )=>{
                        pass.setPipeline( opt.pipeline );
                        defaultRenderFunc( pass );
                  }
            if( !opt.uniforms.buffer )
                  return ( arrays: RenderableArrays, pass: GPURenderPassEncoder )=>{
                        pass.setBindGroup( 0, opt.uniforms!.bindGroup );
                        pass.setPipeline( opt.pipeline );
                        defaultRenderFunc( pass );
                  }
            const uniforms = ( arrays: RenderableArrays, pass: GPURenderPassEncoder )=>{
                        this.device?.queue.writeBuffer( opt.uniforms!.buffer!, 0,  new Float32Array( arrays.transformations ) );
                        if( opt.uniforms?.boneBuffer ){
                              console.log( arrays.bones )
                              this.device?.queue.writeBuffer( opt.uniforms!.boneBuffer!, 0,  new Float32Array( arrays.bones ) );
                        }
                  pass.setBindGroup( 0, opt.uniforms!.bindGroup );
            }
            return ( arrays: RenderableArrays, pass: GPURenderPassEncoder )=>{
                  pass.setPipeline( opt.pipeline );
                  uniforms( arrays, pass );
                  defaultRenderFunc( pass );
            }
      }
      private useImage( image: ImageBitmap ): GPUTexture {
            const texture = this.createTexture({
                  usage: 
                        GPUTextureUsage.TEXTURE_BINDING |
                        GPUTextureUsage.COPY_DST |
                        GPUTextureUsage.RENDER_ATTACHMENT,
                  width: image.width,
                  height: image.height,
                  format: 'rgba8unorm'

            });
            this.device?.queue.copyExternalImageToTexture(
                  { source: image, flipY: true },
                  { texture },
                  { width: image.width, height: image.height },
            );
            return texture;
      }
      private initUniformsBuffers( pipeline: GPURenderPipeline, stride: number, bindings: string[], imageData?: DrawableImageOptions, bones?: number ): UniformInformation {
            const buffers: Resources[] = [];
            let buffer: GPUBuffer | undefined;
            let boneBuffer: GPUBuffer | undefined;
            const funcs: { [k in BN]: (arg: any)=>void;} & { [UNIFORM]: (arg: any)=>void } = {
                  [BN.displacementMap]: (resource: Resources)=>{
                        if( imageData && imageData.displacementMap )
                        resource.texture = this.useImage( imageData.displacementMap! ).createView();
                  },
                  [BN.texture]: (resource: Resources)=>{
                        if( imageData )
                        resource.texture = this.useImage( imageData.image ).createView();
                  },
                  [BN.textureSampler]: (resource: Resources)=>{
                        resource.texture = this.device?.createSampler();
                  },
                  [BN.bones]: ( resource: Resources )=>{
                        if( !bones )
                              this.error( `uniform bind group (bones number not defined)`, RendererErrorType.initialization )
                        boneBuffer = this.createBuffer({
                              // 16 elements for each matrix
                              arrayByteLength: Float32Array.BYTES_PER_ELEMENT * 16 * bones!,
                              usage: BufferUsage.uniform
                        });
                        resource.buffer = boneBuffer;
                  },
                  [UNIFORM]: (resource: Resources)=>{
                        buffer = this.createBuffer({
                              arrayByteLength: stride,
                              usage: BufferUsage.uniform,
                        });
                        resource.buffer = buffer;
                  }
            };
            for( let i = 0; i < bindings.length; i++ ){
                  const resource: Resources = {
                        location: i,
                  }
                  if( funcs[ bindings[i] as BN ] ){
                        funcs[ bindings[i] as BN ]( resource );
                  }else{
                        this.error( `uniform bind group (name ${bindings[i]} not recognized)`, RendererErrorType.initialization )
                  }
                  buffers.push( resource )
            }
            const bindGroup = this.createUniformBindingGroup( {
                  pipeline,
                  buffers
            })
            return {
                  buffer,
                  boneBuffer,
                  bindGroup,
            }
      }
      private setProgramAttributes( opt: DrawableElementAttributes ){
            const data = ProgramSetterDelegate.getProperties( opt, ProgramMode.webgpu );
            const pipeline = this.createPipeline({
                  vShader: data.vertex,
                  fShader: data.fragment,
                  buffers: [...data.attributes.values()],
                  stride: data.attributeStride,
                  enableDepth: true,
                  topology: opt.primitive || Primitives.triangles
            });
            const vertexBuffer = this.createBuffer({
                        data: data.unifiedAttributeBuffer,
                        dataType: BufferDataType.float32,
                        label: 'vertex buffer',
            });
            if( !opt.indices ){
                  opt.indices = this.setIndexArray( 
                        opt.vertices.length, 
                        opt.primitive || Primitives.triangles
                  )
            }
            const N_OF_VERTICES = opt.indices.length;
            
            const indexBuffer = this.createBuffer({
                  data: opt.indices,
                  dataType: BufferDataType.uint16,
                  label: 'index buffer',
                  usage: BufferUsage.index
            });
            let uniforms: UniformInformation | undefined;
            if( data.bindings && data.bindings.length > 0 )
                  uniforms = this.initUniformsBuffers( 
                        pipeline, 
                        data.uniformStride, 
                        data.bindings!, 
                        opt.imageData, 
                        opt.bonesData?.bones || 0 
                  );
            return {
                  renderFunctionAttribs: {
                        pipeline,
                        vertexBuffer,
                        N_OF_VERTICES,
                        indexBuffer,
                        uniforms,
                  },
                  uniformsName: data.uniformsName,
            }
      }
      private initArrays( opt: DrawableElementAttributes ): RenderableArrays & { skeleton: Skeleton } {
            const bonesMatrix: number[] = [];
            const bones: Bone[] = [];
            if( opt.bonesData ){
                  for( let i = 0; i < opt.bonesData.bones; i++ ){
                        bonesMatrix.push( ...Matrix.IDENTITY_4X4 );
                        bones.push({
                              inversePose: Matrix.IDENTITY_4X4,
                              transformationMatrix: Matrix.IDENTITY_4X4
                        })
                  }
            }
            return {
                  bones: bonesMatrix,
                  transformations: Matrix.IDENTITY_4X4,
                  skeleton: {
                        root: opt.bonesData?.root || 0,
                        bones,
                        indices: opt.bonesData?.indices || []
                  }
            }
      }
      private getArrays( bones: Skeleton, uniformsName: string[], opt: DrawOpt ) {
            const uniformArray: number[] = [];
            const bonesArray: number[] = [];
            const funcs: UniformsSetterFunction = {
                  [UN.perspective]: ()=>{
                        uniformArray.push( ...this.view.perspectiveMatrix );
                  },
                  [UN.transformation]: ()=>{
                        uniformArray.push( ...this.view.getTransformationMatrix( opt ) );
                  },
                  [UN.bumpScale]: ()=>{
                        uniformArray.push( opt?.bumpScale || 1 );
                  },
                  [UN.framePosition]: ()=>{
                        uniformArray.push( ...( opt?.animationVector || [ 0, 0 ] ) );
                  },
            };
            for( let name of uniformsName ){
                  funcs[name as UN]();
            }
            if( opt.bones && ( opt.bones.angle || opt.bones.translate ) ){
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
            }
            return {
                  uniformArray,
                  bonesArray
            };
      }
      create( opt: DrawableElementAttributes ): Renderable {
            const arrays = this.initArrays( opt );
            const attribs = this.setProgramAttributes( opt );
            return {
                  function: this.createRenderFunction({
                        ...attribs.renderFunctionAttribs
                  }),
                  arrays: {
                        bones: arrays.bones,
                        transformations: arrays.transformations
                        
                  },
                  skeleton: arrays.skeleton,
                  uniformsName: attribs.uniformsName,
                  attributes: {}
            }
      }
      append( name: string, obj: Renderable ): this {
            this.objects.set( name, obj );
            return this;
      }
      setAttributes( name: string, attributes: DrawOpt ): this {
            if( !this.objects.has( name ) ){
                  console.warn(`object ${name} does not exist`);
                  return this;
            }
            const obj = this.objects.get( name );
            obj!.attributes = {
                  ...obj!.attributes,
                  ...attributes
            }
            const arrays = this.getArrays( obj!.skeleton, obj!.uniformsName, obj!.attributes );
            const transformations = arrays.uniformArray.length > 0 ? arrays.uniformArray: obj!.arrays.transformations;
            const bones = arrays.bonesArray.length > 0? arrays.bonesArray: obj!.arrays.bones;
            obj!.arrays! = {
                  bones,
                  transformations
            }
            return this;
      }
      setToAll( attributes: DrawOpt ): this {
            for( let el of this.objects.keys() ){
                  this.setAttributes( el, attributes );
            }
            return this;
      }
      remove( name: string ): Renderable | undefined {
            if( !this.objects.has( name ) ){
                  console.warn(`object ${name} does not exist`);
                  return;
            }
            const obj = this.objects.get( name );
            this.objects.delete( name );
            return obj;
      }
      draw(): void {
            if( !this.renderPassDescriptor ) return;
            this.setRenderPassDescriptorView( this.renderPassDescriptor, true );
            const encoder = this.device?.createCommandEncoder();
            if( !encoder ) 
                  return;
            const pass = encoder.beginRenderPass( this.renderPassDescriptor );
            for( let el of this.objects.values() )
                  el.function( el.arrays, pass )
            pass.end()
            this.device?.queue.submit( [encoder.finish()] );
      }
}
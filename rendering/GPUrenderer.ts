import { WebGPU, Resources } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import { UniformsName as UN, BindingsName as BN } from './shaders/shaderModel.js';
import * as Types from './types.js';
import { UNIFORM } from "./shaders/GPUShader.js";

type UniformInformation = { 
      buffer: GPUBuffer | undefined, 
      bindGroup: GPUBindGroup, 
      data: Float32Array, 
} 
type WebGPURenderFunctionData = {
      pipeline: GPURenderPipeline,
      vertexBuffer: GPUBuffer,
      N_OF_VERTICES: number,
      indexBuffer: GPUBuffer,
      uniforms?: UniformInformation,
      perspective: boolean,
      oldData: Types.DrawOpt,
      uniformsName: string[],
}
type UniformsSetterFunction = {
      [ T in UN ]: ()=>void; 
}


export class Renderer extends WebGPU { 

      protected objects: Map<string,Types.Renderable> = new Map<string,Types.Renderable>();
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
      private setIndexArray( vertices: number, primitive: Types.Primitives ): number[]{
            const count = this.getPrimitivesVertexCount( primitive );
            const indices: number[] = [];
            for( let i = 0; i < vertices/count; i++ )
                  indices.push(i);
            return indices;
      }
      private createRenderFunction( opt: WebGPURenderFunctionData ): Types.RenderFunction {
            const defaultRenderFunc = ( pass: GPURenderPassEncoder )=>{
                  pass.setIndexBuffer( opt.indexBuffer, 'uint16' );
                  pass.setVertexBuffer( 0, opt.vertexBuffer );
                  pass.drawIndexed( opt.N_OF_VERTICES )
            }
            if( !opt.uniforms )
                  return ( drawOpt: Types.DrawOpt, pass: GPURenderPassEncoder )=>{
                        pass.setPipeline( opt.pipeline );
                        defaultRenderFunc( pass );
                  }
            console.log('no uniform')
            if( !opt.uniforms.buffer )
                  return ( drawOpt: Types.DrawOpt, pass: GPURenderPassEncoder )=>{
                        pass.setBindGroup( 0, opt.uniforms!.bindGroup );
                        pass.setPipeline( opt.pipeline );
                        defaultRenderFunc( pass );
                  }
            console.log('no buffer')
            const uniforms = ( drawOpt: Types.DrawOpt, pass: GPURenderPassEncoder )=>{
                  if( JSON.stringify( opt.oldData ) !== JSON.stringify( drawOpt ) ){
                        opt.uniforms!.data = ( new Float32Array( this.getUniformsData( opt.uniformsName, drawOpt ) ) );
                        opt.oldData = drawOpt;
                  }
                  this.device?.queue.writeBuffer( opt.uniforms!.buffer!, 0,  opt.uniforms!.data );
                  pass.setBindGroup( 0, opt.uniforms!.bindGroup );
            }
            return ( drawOpt: Types.DrawOpt, pass: GPURenderPassEncoder )=>{
                  pass.setPipeline( opt.pipeline );
                  uniforms( drawOpt, pass );
                  defaultRenderFunc( pass );
            }
      }
      private getUniformsData( uniformsName: string[], opt: Types.DrawOpt ): number[] {
            const uniformArray: number[] = []
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
            return uniformArray;
      }
      private useImage( image: ImageBitmap ){
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
            const sampler = this.device?.createSampler()
            return {
                  sampler: sampler,
                  texture: texture,
            }
      }
      private setUniforms( pipeline: GPURenderPipeline, stride: number, bindings: {type: string, name: string}[], imageData?: Types.DrawableImageOptions ){
            const buffers: Resources[] = [];
            let buffer: GPUBuffer | undefined;
            const funcs: { [k in BN]: (arg: any)=>void;} & { [UNIFORM]: (arg: any)=>void } = {
                  [BN.displacementMap]: (resource: Resources)=>{
                        if( imageData && imageData.displacementMap )
                        resource.texture = this.useImage( imageData.displacementMap! ).texture.createView();
                  },
                  [BN.texture]: (resource: Resources)=>{
                        if( imageData )
                        resource.texture = this.useImage( imageData.image ).texture.createView();
                  },
                  [BN.textureSampler]: (resource: Resources)=>{
                        resource.texture = this.device?.createSampler();
                  },
                  [UNIFORM]: (resource: Resources)=>{
                        buffer = this.createBuffer({
                              arrayByteLength: stride,
                              usage: Types.BufferUsage.uniform,
                        });
                        resource.buffer = buffer;
                  }
            };
            for( let i = 0; i < bindings.length; i++ ){
                  const resource: Resources = {
                        location: i,
                  }
                  if( funcs[ bindings[i].name as BN ] ){
                        funcs[ bindings[i].name as BN ]( resource );
                  }else{
                        this.error( `uniform bind group (name ${bindings[i].name} not recognized)`, Types.RendererErrorType.initialization )
                  }
                  buffers.push( resource )
            }
            const bindGroup = this.createUniformBindingGroup( {
                  pipeline,
                  buffers
            })
            return {
                  buffer,
                  bindGroup,
                  data: new Float32Array([]),
            }
      }
      private setProgramAttributes( opt: Types.DrawableElementAttributes ){
            const data = ProgramSetterDelegate.getProperties( opt, Types.ProgramMode.webgpu );
            const pipeline = this.createPipeline({
                  vShader: data.vertex,
                  fShader: data.fragment,
                  buffers: [...data.attributes.values()],
                  stride: data.attributeStride,
                  enableDepth: true,
                  topology: opt.primitive || Types.Primitives.triangles
            });
            const vertexBuffer = this.createBuffer({
                        data: data.unifiedAttributeBuffer,
                        dataType: Types.BufferDataType.float32,
                        label: 'vertex buffer',
            });
            if( !opt.indices ){
                  opt.indices = this.setIndexArray( 
                        opt.vertices.length, 
                        opt.primitive || Types.Primitives.triangles
                  )
            }
            const N_OF_VERTICES = opt.indices.length;
            
            const indexBuffer = this.createBuffer({
                  data: opt.indices,
                  dataType: Types.BufferDataType.uint16,
                  label: 'index buffer',
                  usage: Types.BufferUsage.index
            });
            let uniforms: UniformInformation | undefined;
            if( data.bindings && data.bindings.length > 0 )
                  uniforms = this.setUniforms( pipeline, data.uniformStride, data.bindings!, opt.imageData );
            return {
                  pipeline,
                  vertexBuffer,
                  N_OF_VERTICES,
                  indexBuffer,
                  uniforms,
                  uniformsName: data.uniformsName,
            }
      }
      create( opt: Types.DrawableElementAttributes ): Types.RenderFunction {
            return this.createRenderFunction({
                  ...this.setProgramAttributes( opt ),
                  perspective: opt.perspective || false,
                  oldData: {},
            });
      }
      append( name: string, func: Types.RenderFunction ): this {
            this.objects.set( name,{
                  function: func,
                  attributes: {}
            })
            return this;
      }
      setAttributes( name: string, attributes: Types.DrawOpt ): this {
            if( !this.objects.has( name ) ){
                  console.warn(`object ${name} does not exist`);
                  return this;
            }
            this.objects.get( name )!.attributes  = {
                  ...this.objects.get( name )!.attributes,
                  ...attributes
            }
            return this;
      }
      remove( name: string ): Types.RenderFunction | undefined {
            if( !this.objects.has( name ) ){
                  console.warn(`object ${name} does not exist`);
                  return;
            }
            const func = this.objects.get( name )?.function;
            this.objects.delete( name );
            return func;
      }
      draw(): void {
            if( !this.renderPassDescriptor ) return;
            this.setRenderPassDescriptorView( this.renderPassDescriptor, true );
            const encoder = this.device?.createCommandEncoder();
            if( !encoder ) 
                  return;
            const pass = encoder.beginRenderPass( this.renderPassDescriptor );
            for( let el of this.objects.values() )
                  el.function( el.attributes, pass )
            pass.end()
            this.device?.queue.submit( [encoder.finish()] );
      }
}


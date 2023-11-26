import * as Types from "../types.js";
import * as Model from "../rendererModel.js";

export type Resources = {
      location: number,
      buffer?: GPUBuffer,
      texture?: GPUSampler | GPUTextureView | GPUExternalTexture
}
export type BindGroupOpt = {
      pipeline: GPURenderPipeline,
      buffers: Resources[]
}
export type GPUTextureDescriptor = {
      format: GPUTextureFormat, 
      sampled: boolean,
      width: number, 
      height: number,
      usage: number,
}
export class WebGPU extends Model.Renderer {

      protected device?: GPUDevice;
      protected adapter?: GPUAdapter;

      protected ctx: GPUCanvasContext;
      protected canvasFormat?: GPUTextureFormat;
      protected renderTarget?: GPUTexture;
      protected depthTexture?: GPUTexture;

      protected _culling: boolean = false;

      private _antialias: number = 4;

      clearColor: Types.Color = {
            r: 0,
            g: 0,
            b: 0,
            a: 1
      }

      get culling(): boolean { return this._culling; }
      set culling( value: boolean ) {
            this._culling = value;
      }

      get antialias(): boolean {
            return this._antialias === 4;
      }
      set antialias(value: boolean) {
            if( value )
                  this._antialias = 4;
            else 
                  this._antialias = 1;
      }

      
      constructor( protected cvs: HTMLCanvasElement ){
            super();
            this.ctx = this.cvs.getContext('webgpu') as GPUCanvasContext;
            if( !this.ctx )
                  this.error( 'context', Types.RendererErrorType.acquisition );
            if( !navigator.gpu )
                  throw 'webgpu not enabled';
                  
      }
      async init(){
            this.adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
            if( !this.adapter ){
                  this.error( 'adapter', Types.RendererErrorType.acquisition );
            } 
            this.device = await this.adapter.requestDevice();

            this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

            this.depthTexture = this.createTexture( { format: 'depth24plus', sampled: true } );

            this.ctx.configure({
                  device: this.device,
                  format: this.canvasFormat,
                  alphaMode:'opaque'
            });

            this.renderTarget = this.createTexture({ format: this.canvasFormat, sampled: true } );
            return this;
      }
      protected getPrimitive( primitive: Types.Primitives ): GPUPrimitiveTopology {
            switch( primitive ){
                  case Types.Primitives.lines: return 'line-list';
                  case Types.Primitives.lines_strip: return 'line-strip';
                  case Types.Primitives.triangles: return 'triangle-list';
                  case Types.Primitives.triangles_strip: return 'triangle-strip';
                  default: return 'point-list';
            }
      }
      protected getBufferUsage( bufferUsage: Types.BufferUsage ): number {
            switch( bufferUsage ) {
                  case Types.BufferUsage.vertex: return GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
                  case Types.BufferUsage.index: return GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST;
                  case Types.BufferUsage.uniform: return GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
            }
      }
      protected createBufferData( buffer: Types.BufferData ): GPUVertexAttribute {
            const format = buffer.components > 1? 
            `${buffer.dataType}x${buffer.components}`
            : buffer.dataType;
            return {
                  shaderLocation: buffer.shaderLocation,
                  format: format as GPUVertexFormat,
                  offset: buffer.offset
            }
      }
      protected createEntriesDescription( buffers: Resources[] ){
            const entries: GPUBindGroupEntry[] = [];
            for( let el of buffers ){
                  let resource;
                  if( el.texture instanceof GPUTexture ){
                        resource = (el.texture as GPUTexture ).createView();
                  }else if( el.texture instanceof GPUExternalTexture || el.texture instanceof GPUSampler || el.texture instanceof GPUTextureView ){
                        resource = el.texture;
                 } else if( el.buffer ){
                        resource = { buffer: el.buffer };
                  }else{
                        this.error( `bind group (uncaught type ${ el.texture} for resources )`, Types.RendererErrorType.creation )
                  }
                  entries.push({
                        binding: el.location,
                        resource: resource as GPUBindingResource
                  })
            }
            return entries;
      }
      protected createUniformBindingGroup( opt: BindGroupOpt ): GPUBindGroup {
            const entries = this.createEntriesDescription( opt.buffers );
            const bindGroup = this.device?.createBindGroup({
                  layout: opt.pipeline.getBindGroupLayout(0),
                  entries
            });
            if( !bindGroup )
                  this.error( 'bind group', Types.RendererErrorType.creation );
            return bindGroup as GPUBindGroup
      }
      /**
       * 
       * @param buffers generic buffer data
       * @param stride total length of the struct (also bytes)
       */
      protected vertexAttributeDescription( buffers: Types.BufferData[], stride: number ): GPUVertexBufferLayout {
            const attributes: GPUVertexAttribute[] = [];
            for( let el of buffers ) 
                  attributes.push( this.createBufferData( el ) );
            return {
                  arrayStride: stride,
                  attributes,
                  stepMode: 'vertex',
            }
      }
      private bufferDescription( arrayByteLength: number, usage: number, label: string = 'buffer', mapped: boolean = false ): GPUBufferDescriptor {
            return {
                  label: label,
                  size: (arrayByteLength + 3) & ~3,
                  usage: usage | GPUBufferUsage.COPY_DST,
                  mappedAtCreation: mapped,
            };
      }
      private mapBuffer( buffer: GPUBuffer, data: Types.TypedArray ): void {
            new (Object.getPrototypeOf( data ).constructor)( buffer.getMappedRange() ).set( data );
            buffer.unmap();
      }
      protected createTexture( opt: Partial<GPUTextureDescriptor> ): GPUTexture {
            const texture = this.device?.createTexture({
                  size: [
                        opt.width || this.cvs.width, 
                        opt.height || this.cvs.height, 
                        1],
                  format: opt.format || this.canvasFormat as GPUTextureFormat,
                  sampleCount: opt.sampled? this._antialias: 1,
                  usage: opt.usage || GPUTextureUsage.RENDER_ATTACHMENT,
            });
            if( !texture )
                  this.error( `texture ${opt.format}`, Types.RendererErrorType.creation );
            return texture as GPUTexture;
      }
      private pipelineDescription( opt: Types.ProgramOpt ): GPURenderPipelineDescriptor {
            const shaderModule = this.createShader( opt.vShader + opt.fShader );
            const description: GPURenderPipelineDescriptor = {
                  vertex: {
                        module: shaderModule,
                        entryPoint: opt.vEntryPoint || 'vertex_shader',
                        buffers: [ this.vertexAttributeDescription( opt.buffers, opt.stride ) ],
                  },
                  fragment: {
                        module: shaderModule,
                        entryPoint: opt.fEntryPoint || 'fragment_shader',
                        targets: [{
                              format: this.canvasFormat as GPUTextureFormat
                        }]
                  },
                  primitive: {
                        topology: this.getPrimitive( opt.topology || Types.Primitives.triangles ),
                        cullMode: (this._culling? 'back': 'none') as GPUCullMode,
                  },
                  layout: 'auto' as 'auto',
                  multisample: {
                        count: this._antialias
                  }
            };
            if( opt.enableDepth ){
                  return {
                        ...description, 
                        depthStencil: {
                              depthWriteEnabled: true,
                              depthCompare: 'less',
                              format: 'depth24plus',
                        }
                  }
            }
            return description;
      }
      protected setRenderPassDescriptorView( renderPassDescriptor: GPURenderPassDescriptor, enableDepth: boolean = true ): GPURenderPassDescriptor {
            /*if( enableDepth && renderPassDescriptor.depthStencilAttachment )
                  renderPassDescriptor.depthStencilAttachment.view = this.depthTexture?.createView() as GPUTextureView;*/
            if (this._antialias === 1) {
                  (renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.ctx.getCurrentTexture().createView();
                  return renderPassDescriptor;
            }
            (renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.renderTarget?.createView() as GPUTextureView;
            (renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].resolveTarget = this.ctx.getCurrentTexture().createView();
            return renderPassDescriptor;
      }
      protected createRenderPassDescriptor( enableDepth: boolean ): GPURenderPassDescriptor {
            const description: GPURenderPassDescriptor = {
                  colorAttachments: [{
                        view: this.ctx.getCurrentTexture().createView(),
                        clearValue: this.clearColor, //background color
                        loadOp: 'clear',
                        storeOp: 'store'
                  }],
            };
            if( this._antialias == 4 ){
                  (description.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.renderTarget?.createView() as GPUTextureView;
                  (description.colorAttachments as GPURenderPassColorAttachment[])[0].resolveTarget = this.ctx.getCurrentTexture().createView();
            }
            if( enableDepth ) 
                  return { 
                        ...description,
                        depthStencilAttachment: {
                              view: this.depthTexture?.createView() as GPUTextureView,
                              depthClearValue: 1.0,
                              depthLoadOp: 'clear',
                              depthStoreOp: "store",
                        }
                  }
            return description;
      }
      protected createBuffer( opt: Partial<Types.BufferOpt> ): GPUBuffer {
            let length: number = 0;
            let mapped = false;
            let constructor: Types.TypedArrayConstructor = Float32Array;
            if( !opt.data && !opt.arrayByteLength ){
                  throw `Buffer cannot be created. Missing data property or arrayByteLength property`;
            }
            if( opt.arrayByteLength )
                  length = opt.arrayByteLength;
            else if( opt.data ){
                  mapped = true;
                  constructor = this.getTypedArrayInitializer( opt.dataType || Types.BufferDataType.float32 );
                  length = opt.data.length * constructor.BYTES_PER_ELEMENT;
            }
            const descriptor = this.bufferDescription(
                  length,
                  this.getBufferUsage(opt.usage || Types.BufferUsage.vertex),
                  opt.label || 'buffer',
                  mapped
            );
            const buffer = this.device?.createBuffer( descriptor );

            if( !buffer )
                  this.error( 'buffer', Types.RendererErrorType.creation );

            if( opt.data ){
                  this.mapBuffer( buffer as GPUBuffer, new constructor( opt.data ) )
            }
            return buffer as GPUBuffer;
      }
      protected createPipeline( opt: Types.ProgramOpt ): GPURenderPipeline {
            const pipelineDescription: GPURenderPipelineDescriptor = this.pipelineDescription( opt );
            const pipeline = this.device?.createRenderPipeline( pipelineDescription );
            if( !pipeline )
                  this.error( 'pipeline', Types.RendererErrorType.creation )
            return pipeline as GPURenderPipeline;
      }
      protected createShader( srcCode: string ): GPUShaderModule {
            const shader = this.device?.createShaderModule({ code: srcCode });
            if( !shader )
                  this.error( 'shader', Types.RendererErrorType.creation );
            return shader as GPUShaderModule;
      }
}
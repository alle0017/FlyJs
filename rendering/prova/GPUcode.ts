import * as Types from "./generics.js";
import * as Model from "./rendererModel.js";


export class WebGPU extends Model.Renderer {

      device?: GPUDevice;
      protected adapter?: GPUAdapter;

      protected ctx: GPUCanvasContext;
      protected canvasFormat?: GPUTextureFormat;
      protected renderTarget?: GPUTexture;
      protected depthTexture?: GPUTexture;

      protected _culling: boolean = false;

      private _antialias: number = 4;

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

            this.depthTexture = this.createTexture( 'depth24plus' );

            this.ctx.configure({
                  device: this.device,
                  format: this.canvasFormat,
                  alphaMode:'opaque'
            });

            this.renderTarget = this.createTexture( this.canvasFormat );
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
      private createTexture( format: GPUTextureFormat ): GPUTexture {
            const texture = this.device?.createTexture({
                  size: [this.cvs.width, this.cvs.height, 1],
                  format,
                  sampleCount: this._antialias,
                  usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            if( !texture )
                  this.error( `texture ${format}`, Types.RendererErrorType.creation );
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
                        clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1 }, //background color
                        loadOp: 'load',
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
      protected createBindGroup( ){

      }
      protected createBuffer( opt: Partial<Types.BufferOpt> ): GPUBuffer {
            let length: number = 0;
            let mapped = false;
            let constructor: Types.TypedArrayConstructor = Float32Array;
            if( !opt.data && !opt.arrayByteLength ){
                  throw `Buffer cannot be created. Missing data property or dataByteLength property`;
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
                  opt.usage || ( GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST ),
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
import {WebGPUShader} from './GPUShader.js';
import * as Types from './generics.js';

export class WebGPUCodeDelegate {
      device?: GPUDevice;
      protected adapter?: GPUAdapter;
      //protected encoder?: GPUCommandEncoder;

      protected ctx: GPUCanvasContext;
      protected canvasFormat?: GPUTextureFormat;

      protected _culling: boolean = false;

      constructor( protected cvs: HTMLCanvasElement ) {
            this.ctx = cvs.getContext('webgpu') as GPUCanvasContext;
            if( !this.ctx ){
                  throw 'fallback to webgl'
            }
      }
      async configure(): Promise<WebGPUCodeDelegate> {

            this.adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
            if( !this.adapter ){
                  throw 'error while getting webgpu adapter';
            }
            this.device = await this.adapter.requestDevice();

            if( navigator.gpu ){
                  this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
                  this.ctx.configure({
                        device: this.device,
                        format: this.canvasFormat,
                  });
            }
            return this;
      }

      protected createBufferLayout( typeFormat: string ){
            return {
                  shaderLocation: 0,
                  offset: 0,
                  format: typeFormat
            }
      }
      protected createBuffer( arrayByteLength: number , usage: number, mapped: boolean = false, label: string = 'vertex buffer' ): GPUBuffer {
            const bufferDescription: GPUBufferDescriptor = {
                  label: label,
                  size: (arrayByteLength + 3) & ~3,
                  usage: usage | GPUBufferUsage.COPY_DST,
                  mappedAtCreation: mapped,
            };
            const buffer = this.device?.createBuffer( bufferDescription );

            if( !buffer ){
                  throw `something went wrong in buffer ${label} creation`;
            }


            return buffer;
      }
      protected createMappedBuffer( arr: Types.TypedArray , usage: number, label: string = 'vertex buffer' ): GPUBuffer {
            const buffer = this.createBuffer( arr.byteLength , usage , true, label );

            if( !buffer ){
                  throw `something went wrong in buffer ${label} creation`;
            }

            const writeArray = new (Object.getPrototypeOf( arr ).constructor)( buffer.getMappedRange() );
            writeArray.set( arr );
            buffer.unmap();

            return buffer;
      }
      protected createBindGroup( pipeline: GPURenderPipeline, bindings: GPUBindingResource[] ): GPUBindGroup {
            const entries: GPUBindGroupEntry[] = [];
            for( let i = 0; i < bindings.length; i++ ){
                        entries.push({ 
                              binding: i, 
                              resource: bindings[i]
                        })
            }
            const bindGroup =  this.device?.createBindGroup({
                  layout: pipeline.getBindGroupLayout(0),
                  entries,
            });
            if( !bindGroup )
                  throw 'something went wrong in bind group creation';
            return bindGroup;
      }
      protected getVertexBufferLayout( attributes: GPUVertexAttribute[], offset: number ): GPUVertexBufferLayout {

            return {
                  attributes: attributes,
                  arrayStride: offset,
                  stepMode: 'vertex'
            }
      }
      protected createTexture( img: ImageBitmap ): GPUTexture {
            const texture = this.device?.createTexture({
                  size: [img.width, img.height],
                  format: 'rgba8unorm',
                  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });
            if( !texture )
                  throw 'something went wrong in texture creation';
            this.device?.queue.copyExternalImageToTexture(
                  { source: img, flipY: true },
                  { texture },
                  { width: img.width, height: img.height },
            );
            return texture;
      }
      protected createSampler(): GPUSamplerDescriptor {
            const sampler = this.device?.createSampler();
            if( !sampler )
                  throw 'something went wrong in sampler creation';
            return sampler;
      }
      protected createShaderModules( shaderInfo: WebGPUShader ): GPUShaderModule {
            const shaders = shaderInfo.get();
            const shaderCode = shaders.vertex + shaders.fragment;
            const shaderModule =  this.device?.createShaderModule({
                  code: shaderCode,
            });
            if(!shaderModule)
                  throw 'something went wrong in shader creation';
            return shaderModule;
      }
      protected createPipelineDescription( shaderModule: GPUShaderModule, layout: GPUVertexBufferLayout ): GPURenderPipelineDescriptor { 
            
            if(!this.canvasFormat) 
                  throw 'canvas format not defined'
            return {
                  vertex: {
                        module: shaderModule,
                        entryPoint: "vertex_shader",
                        buffers: [ layout ],
                  },
                  fragment: {
                        module: shaderModule,
                        entryPoint: "fragment_shader",
                        targets: [
                              {
                                    format: this.canvasFormat,
                              },
                        ],
                  },
                  primitive: {
                        frontFace: 'cw',
                        cullMode: this._culling? 'back': 'none',
                        topology: 'triangle-list',
                  },
                  depthStencil: {
                        depthWriteEnabled: true,
                        depthCompare: 'less',
                        format: 'depth24plus',
                  },
                  layout: "auto",
            }
      }
      protected createDepthTexture(): GPUTexture {
            const depthTexture = this.device?.createTexture({
                  size: [this.cvs.width, this.cvs.height, 1],
                  format: 'depth24plus',
                  usage: GPUTextureUsage.RENDER_ATTACHMENT,
            })
            if( !depthTexture ) 
                  throw 'something went wrong in creating depth texture'
            return depthTexture;
      }
      protected createRenderPassDescription( color: Types.Color = { r: 0, g: 0, b: 0, a: 0 } ): GPURenderPassDescriptor {
            
            return {
                  label: 'canvas renderPass',
                  colorAttachments: [
                        {
                              view: this.ctx.getCurrentTexture().createView(),//<- to be filled out when we render
                              clearValue: [ color.r, color.g, color.b, color.a ],
                              loadOp: 'clear',
                              storeOp: 'store',
                        },
                  
                  ],
                  depthStencilAttachment: {
                        view: this.createDepthTexture().createView(),  // Assigned later
                        depthClearValue: 1,
                        depthLoadOp: 'clear',
                        depthStoreOp: 'store',
                  },
            }
      }
}
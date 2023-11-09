import {WebGPUShader} from './GPUShader.js';
import * as Types from './generics.js';
/**
* 
* @hideconstructor
*/
export class WebGPURenderer {

      protected device?: GPUDevice;
      protected adapter?: GPUAdapter;
      protected encoder?: GPUCommandEncoder;

      protected ctx: GPUCanvasContext;
      protected canvasFormat?: GPUTextureFormat;

      protected _culling: boolean = false;

      constructor( cvs: HTMLCanvasElement ) {
            this.ctx = cvs.getContext('webgpu') as GPUCanvasContext;
            if( !this.ctx ){
                  throw 'fallback to webgl'
            }
      }

      static async new( cvs: HTMLCanvasElement ): Promise<WebGPURenderer> {
            const renderer = new WebGPURenderer( cvs );

            renderer.adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
            if( !renderer.adapter ){
                  throw 'error while getting webgpu adapter';
            }
            renderer.device = await renderer.adapter.requestDevice();

            if( navigator.gpu ){
                  renderer.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
                  renderer.ctx.configure({
                        device: renderer.device as GPUDevice,
                        format: renderer.canvasFormat as GPUTextureFormat,
                  });
                  renderer.encoder = renderer.device.createCommandEncoder();
            }
            return renderer;
      }

      protected createBufferLayout( typeFormat: string ){
            return {
                  shaderLocation: 0,
                  offset: 0,
                  format: typeFormat
            }
      }
      protected createBuffer( arrayByteLength: number , usage: number, mapped: boolean = false, label: string = 'vertex buffer' ): GPUBuffer | undefined {
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
      protected createMergedBuffer( shaderInfos: WebGPUShader, numberOfVertices: number ): GPUBuffer {
            
            const arr: number[] = [];

            for( let i = 0; i < numberOfVertices; i++ ){
                  for( let el of shaderInfos.attributesData ){
                        if( !el.data ) continue;
                        arr.push(...el.data.slice(i*el.components, (i + 1)*el.components))
                  }
            }
            const vertex = new Float32Array(arr);

            const buffer = this.createBuffer( vertex.byteLength, GPUBufferUsage.VERTEX );
            
            if( !buffer )
                  throw `something went wrong in buffer creation`;

            this.device?.queue.writeBuffer( buffer, 0, vertex );

            return buffer;
      }
      protected createBindGroup( pipeline: GPURenderPipeline, buffer: GPUBuffer, bindingLocation: number ): GPUBindGroup | undefined {
            return this.device?.createBindGroup({
                  layout: pipeline.getBindGroupLayout(bindingLocation),
                  entries: [
                        { 
                              binding: bindingLocation, 
                              resource: { buffer: buffer }
                        },
                  ],
            });
      }
      protected getAttributeInfos( shaderInfo: WebGPUShader ): GPUVertexAttribute[] {
            const attributesInfo: GPUVertexAttribute[] = [];
            for( let el of shaderInfo.attributesData ){
                  attributesInfo.push({
                        shaderLocation: el.bindingLocation,
                        offset: el.offset,
                        format: el.type,
                  });
            }
            return attributesInfo;
      }
      protected getVertexBufferLayout( shaderInfo: WebGPUShader ): GPUVertexBufferLayout {

            const attributes = this.getAttributeInfos( shaderInfo );
            const lastAttributeInfo = shaderInfo.attributesData[shaderInfo.attributesData.length - 1];
            const stride = lastAttributeInfo.offset + lastAttributeInfo.size * lastAttributeInfo.components;

            return {
                  attributes: attributes,
                  arrayStride: stride,
                  stepMode: 'vertex'
            }
      }
      protected createUniform( shaderInfo: WebGPUShader ) {
            const lastUniformInfo = shaderInfo.uniformsData[shaderInfo.uniformsData.length - 1];
            const uniformBufferSize: number = lastUniformInfo.offset + lastUniformInfo.size * lastUniformInfo.components;

            const buffer = this.createBuffer( uniformBufferSize * 4, GPUBufferUsage.UNIFORM , false, 'uniform buffer' );
            if( !buffer ) {
                  throw 'something went wrong in uniform buffer creation';
            }
            let comp = 0;
            for( const el of shaderInfo.uniformsData ){
                  if( !el.data ) continue;
                  comp+= el.numberOfComponents;
            }
            const uniformsArray = new Float32Array( comp );
            let loaded = 0;
            for( const el of shaderInfo.uniformsData ){
                  if( !el.data ) continue;
                  uniformsArray.set( el.data, loaded );
                  loaded += el.numberOfComponents;
            }
            return {
                  buffer,
                  data: uniformsArray
            }
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
      protected createPipelineDescription( shaderInfo: WebGPUShader ): GPURenderPipelineDescriptor { 
            const shaderModule = this.createShaderModules( shaderInfo );

            if(!this.canvasFormat) 
                  throw 'canvas format not defined'
            return {
                  vertex: {
                        module: shaderModule,
                        entryPoint: "vertex_shader",
                        buffers: [ this.getVertexBufferLayout( shaderInfo ) ],
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
                        cullMode: this._culling? 'front': 'none',
                        topology: "triangle-list",
                  },
                  layout: "auto",
            }
      }
      protected createRenderingPipeline( shaderInfo: WebGPUShader ): GPURenderPipeline {
            const pipelineDescriptor = this.createPipelineDescription( shaderInfo );
            console.log( pipelineDescriptor )
            const pipeline: GPURenderPipeline | undefined = this.device?.createRenderPipeline( 
                  pipelineDescriptor
            );
            if( !pipeline ){
                  throw 'something went wrong in pipeline creation';
            }
            return pipeline;
      }
      protected getNumberOfVertices( shaderInfo: WebGPUShader ): number {
            let v = 0;
            for( let el of shaderInfo.attributesData ) {
                  if( !el.data )
                        throw `attributes ${el.name} have no array binding`;
                  if( v && el.data.length / el.numberOfComponents == v )
                        continue;
                  else if( v ){
                        if( v > el.data.length / el.numberOfComponents )
                              throw `attributes ${el.name} array is to much short`;
                        else 
                              throw `attributes ${el.name} array is to much long`;
                  }     
                  v = el.data.length / el.numberOfComponents;
            }
            return v;
      }
      setup( shaderInfo: WebGPUShader, indices: number[] ){
            const renderPassDescriptor: GPURenderPassDescriptor = {
                  label: 'our basic canvas renderPass',
                  colorAttachments: [
                    {
                      view: this.ctx.getCurrentTexture().createView(),//<- to be filled out when we render
                      clearValue: [0.3, 0.3, 0.3, 1],
                      loadOp: 'clear',
                      storeOp: 'store',
                    },
                  ],
            }
            const N = this.getNumberOfVertices( shaderInfo );
            if( !N ){
                  return;
            }
            const pipeline = this.createRenderingPipeline( shaderInfo );
            const vertexBuffer = this.createMergedBuffer( shaderInfo, N );
            const indicesArray = new Uint16Array(indices);
            const indexBuffer = this.createMappedBuffer( indicesArray, GPUBufferUsage.INDEX, 'index buffer' );
             
            const { buffer, data } = this.createUniform( shaderInfo );

            if( !indexBuffer || !buffer ){
                  throw 'something went wrong in buffer creation';
            }
            const bindGroup = this.createBindGroup( pipeline,  buffer, 0 );

            if( !bindGroup ){
                  throw 'something went wrong in bind group creation';
            }
            return ()=>{
                  const pass = this.encoder?.beginRenderPass( renderPassDescriptor );
                  pass?.setPipeline( pipeline );
                  pass?.setVertexBuffer( 0, vertexBuffer );
                  pass?.setIndexBuffer( indexBuffer, 'uint16' );
                  pass?.setBindGroup( 0, bindGroup );
                  this.device?.queue.writeBuffer( buffer, 0, data );
                  pass?.drawIndexed( N )
                  pass?.end();
                  const commandBuffer = this.encoder?.finish();
                  if( !commandBuffer )
                        return;
                  this.device?.queue.submit( [commandBuffer] );
            };
      }
      enableCulling(): void {
            this._culling = !this._culling;
      }
}
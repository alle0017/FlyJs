import { WebGPU } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import * as Types from './types.js';

export class Renderer extends WebGPU { 

      protected objects: Map<string,Types.Renderable> = new Map<string,Types.Renderable>();
      protected renderPassDescriptor?: GPURenderPassDescriptor;
      private view?: ViewDelegate;


      override async init(): Promise<this> {
            await super.init();
            this.view = new ViewDelegate( this.cvs.width/this.cvs.height );
            this.renderPassDescriptor = this.createRenderPassDescriptor( true );
            return this;
      }
      private setUniforms( pipeline: GPURenderPipeline, data: Types.GPUCodeProperties ){
            const buffer = this.createBuffer({
                  arrayByteLength: data.uniformStride,
                  usage: Types.BufferUsage.uniform,
            })
            const bindGroup = this.createUniformBindingGroup( {
                  pipeline,
                  buffers: [{
                        location: 0,
                        buffer
                  }]
            })
            return {
                  buffer,
                  bindGroup,
                  data: new Float32Array([])
            }
      }

      create( opt: Types.DrawableElementAttributes ): Types.RenderFunction {

            const data = ProgramSetterDelegate.getProperties( opt, Types.ProgramMode.webgpu );
            
            const pipeline = this.createPipeline({
                  vShader: data.vertex,
                  fShader: data.fragment,
                  buffers: [...data.attributes.values()],
                  stride: data.attributeStride,
                  enableDepth: true,
            });
            const vertexBuffer = this.createBuffer({
                        data: data.unifiedAttributeBuffer,
                        dataType: Types.BufferDataType.float32,
                        label: 'vertex buffer',
            });
            const count = this.getPrimitivesVertexCount( Types.Primitives.triangles );
            if( !opt.indices ){
                  opt.indices = [];
                  for( let i = 0; i < opt.vertices.length/count; i++ )
                        opt.indices.push(i);
            }
            const N_OF_VERTICES = opt.indices.length;
            
            const indexBuffer = this.createBuffer({
                  data: opt.indices,
                  dataType: Types.BufferDataType.uint16,
                  label: 'index buffer',
                  usage: Types.BufferUsage.index
            });
            let uniforms: { buffer: GPUBuffer, bindGroup: GPUBindGroup, data: Float32Array };
            if( data.uniforms.size > 0 )
                  uniforms = this.setUniforms( pipeline, data );
            let perspective = false;
            if( opt.perspective ){
                  perspective = true;
            }
            let oldData: Types.DrawOpt;
            return ( opt: Types.DrawOpt, pass: GPURenderPassEncoder )=>{
                  if( uniforms ){
                        if( JSON.stringify( oldData ) !== JSON.stringify( opt ) ){
                              const mat = this.view?.getTransformationMatrix( opt ) || [];
                              uniforms.data = new Float32Array(
                                    perspective? [...(this.view?.perspectiveMatrix as number[]), ...mat]: mat
                              );
                              oldData = opt;
                        }
                        
                        this.device?.queue.writeBuffer( uniforms.buffer, 0,  uniforms.data );
                        pass.setBindGroup( 0, uniforms.bindGroup );
                  } 
                  pass.setPipeline( pipeline );
                  pass.setIndexBuffer( indexBuffer, 'uint16' );
                  pass.setVertexBuffer( 0, vertexBuffer );
                  pass.drawIndexed( N_OF_VERTICES )
            }
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
      remove( ){}
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


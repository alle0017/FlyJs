import { WebGPU } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import * as Types from './generics.js';

export class Renderer extends WebGPU { 

      protected functions: Types.RenderFunction[] = [];
      protected renderPassDescriptor?: GPURenderPassDescriptor;


      override async init(): Promise<this> {
            await super.init();
            this.renderPassDescriptor = this.createRenderPassDescriptor( true );
            return this;
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
            return ( pass: GPURenderPassEncoder )=>{

                  pass.setPipeline( pipeline );
                  pass.setIndexBuffer( indexBuffer, 'uint16' );
                  pass.setVertexBuffer( 0, vertexBuffer );
                  pass.drawIndexed( N_OF_VERTICES )
            }
      }
      append( func: Types.RenderFunction ): void {
            this.functions.push( func );
      }
      remove( ){}
      draw(): void {
            if( !this.renderPassDescriptor ) return;
            this.setRenderPassDescriptorView( this.renderPassDescriptor, true );
            const encoder = this.device?.createCommandEncoder();
            if( !encoder ) 
                  return;
            const pass = encoder.beginRenderPass( this.renderPassDescriptor );
            for( let func of this.functions )
                  func( pass )
            pass.end()
            this.device?.queue.submit( [encoder.finish()] );
      }
}


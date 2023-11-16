import { WebGPU } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import { UniformsName as UN } from './shaders/shaderModel.js';
import * as Types from './types.js';


type WebGPURenderFunctionData = {
      pipeline: GPURenderPipeline,
      vertexBuffer: GPUBuffer,
      N_OF_VERTICES: number,
      indexBuffer: GPUBuffer,
      uniforms: { buffer: GPUBuffer, bindGroup: GPUBindGroup, data: Float32Array, } | undefined,
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
            const uniforms = ( drawOpt: Types.DrawOpt, pass: GPURenderPassEncoder )=>{
                  if( JSON.stringify( opt.oldData ) !== JSON.stringify( drawOpt ) ){
                        /*const mat = this.view?.getTransformationMatrix( drawOpt ) || [];
                        opt.uniforms!.data = new Float32Array(
                              opt.perspective? [...(this.view?.perspectiveMatrix as number[]), ...mat]: mat
                        );*/
                        opt.uniforms!.data = ( new Float32Array( this.getUniformsData( opt.uniformsName, drawOpt ) ) );
                        opt.oldData = drawOpt;
                  }
                  this.device?.queue.writeBuffer( opt.uniforms!.buffer, 0,  opt.uniforms!.data );
                  pass.setBindGroup( 0, opt.uniforms!.bindGroup );
            }
            return ( drawOpt: Types.DrawOpt, pass: GPURenderPassEncoder )=>{
                  pass.setPipeline( opt.pipeline );
                  uniforms( drawOpt, pass );
                  defaultRenderFunc( pass );
            }
      }
      private getUniformsData( uniformsName: string[], opt: Types.DrawOpt ): number[] {
            // TODO: don't know how displacement and animate are ordered
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
            /*const uniformsFunctions = [
                  ()=>{},
                  ()=>{}
            ]
            if( !elementAttr.imageData )
            return ( opt: Types.DrawOpt )=>{
                  const uniformArray: number[] = [];
                  if( elementAttr.perspective ){
                        uniformArray.push( ...this.view.perspectiveMatrix );
                  }
                  if( !elementAttr.static ){
                        uniformArray.push( ...this.view.getTransformationMatrix( opt ) );
                  }
                  return uniformArray;
            }
            return ( opt: Types.DrawOpt )=>{
                  const uniformArray: number[] = [];
                  if( elementAttr.perspective ){
                        uniformArray.push( ...this.view.perspectiveMatrix );
                  }
                  if( !elementAttr.static ){
                        uniformArray.push( ...this.view.getTransformationMatrix( opt ) );
                  }
                  if( elementAttr.imageData!.animate ){
                        uniformArray.push( ...( opt?.animationVector || [ 0, 0 ] ) );
                  }
                  if( elementAttr.imageData!.displacementMap ){
                        uniformArray.push( opt?.bumpScale || 1 );
                  }
                  return uniformArray;
            }*/
      }
      private setUniforms( pipeline: GPURenderPipeline, data: Types.GPUCodeProperties, opt: Types.DrawableElementAttributes ){
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
                  data: new Float32Array([]),
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
            if( !opt.indices ){
                  const count = this.getPrimitivesVertexCount( Types.Primitives.triangles );
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
            let uniforms: { buffer: GPUBuffer, bindGroup: GPUBindGroup, data: Float32Array, } | undefined;
            if( data.uniforms.size > 0 )
                  uniforms = this.setUniforms( pipeline, data, opt );
            let perspective = false;
            if( opt.perspective ){
                  perspective = true;
            }
            let oldData: Types.DrawOpt = {};
            return this.createRenderFunction({
                  pipeline,
                  vertexBuffer,
                  N_OF_VERTICES,
                  indexBuffer,
                  uniforms,
                  perspective,
                  oldData,
                  uniformsName: data.uniformsName,
            });
            /*return ( opt: Types.DrawOpt, pass: GPURenderPassEncoder )=>{
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
            }*/
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


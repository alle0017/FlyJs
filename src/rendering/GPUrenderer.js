import { WebGPU } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import { UniformsName as UN } from './shaders/shaderModel.js';
import * as Types from './types.js';
export class Renderer extends WebGPU {
    constructor(cvs) {
        super(cvs);
        this.objects = new Map();
        this.view = new ViewDelegate(this.cvs.width / this.cvs.height);
    }
    async init() {
        await super.init();
        this.renderPassDescriptor = this.createRenderPassDescriptor(true);
        return this;
    }
    createRenderFunction(opt) {
        const defaultRenderFunc = (pass) => {
            pass.setIndexBuffer(opt.indexBuffer, 'uint16');
            pass.setVertexBuffer(0, opt.vertexBuffer);
            pass.drawIndexed(opt.N_OF_VERTICES);
        };
        if (!opt.uniforms)
            return (drawOpt, pass) => {
                pass.setPipeline(opt.pipeline);
                defaultRenderFunc(pass);
            };
        const uniforms = (drawOpt, pass) => {
            var _a;
            if (JSON.stringify(opt.oldData) !== JSON.stringify(drawOpt)) {
                /*const mat = this.view?.getTransformationMatrix( drawOpt ) || [];
                opt.uniforms!.data = new Float32Array(
                      opt.perspective? [...(this.view?.perspectiveMatrix as number[]), ...mat]: mat
                );*/
                opt.uniforms.data = (new Float32Array(this.getUniformsData(opt.uniformsName, drawOpt)));
                opt.oldData = drawOpt;
            }
            (_a = this.device) === null || _a === void 0 ? void 0 : _a.queue.writeBuffer(opt.uniforms.buffer, 0, opt.uniforms.data);
            pass.setBindGroup(0, opt.uniforms.bindGroup);
        };
        return (drawOpt, pass) => {
            pass.setPipeline(opt.pipeline);
            uniforms(drawOpt, pass);
            defaultRenderFunc(pass);
        };
    }
    getUniformsData(uniformsName, opt) {
        // TODO: don't know how displacement and animate are ordered
        const uniformArray = [];
        const funcs = {
            [UN.perspective]: () => {
                uniformArray.push(...this.view.perspectiveMatrix);
            },
            [UN.transformation]: () => {
                uniformArray.push(...this.view.getTransformationMatrix(opt));
            },
            [UN.bumpScale]: () => {
                uniformArray.push((opt === null || opt === void 0 ? void 0 : opt.bumpScale) || 1);
            },
            [UN.framePosition]: () => {
                uniformArray.push(...((opt === null || opt === void 0 ? void 0 : opt.animationVector) || [0, 0]));
            },
        };
        for (let name of uniformsName) {
            funcs[name]();
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
    setUniforms(pipeline, data, opt) {
        const buffer = this.createBuffer({
            arrayByteLength: data.uniformStride,
            usage: Types.BufferUsage.uniform,
        });
        const bindGroup = this.createUniformBindingGroup({
            pipeline,
            buffers: [{
                    location: 0,
                    buffer
                }]
        });
        return {
            buffer,
            bindGroup,
            data: new Float32Array([]),
        };
    }
    create(opt) {
        const data = ProgramSetterDelegate.getProperties(opt, Types.ProgramMode.webgpu);
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
        if (!opt.indices) {
            const count = this.getPrimitivesVertexCount(Types.Primitives.triangles);
            opt.indices = [];
            for (let i = 0; i < opt.vertices.length / count; i++)
                opt.indices.push(i);
        }
        const N_OF_VERTICES = opt.indices.length;
        const indexBuffer = this.createBuffer({
            data: opt.indices,
            dataType: Types.BufferDataType.uint16,
            label: 'index buffer',
            usage: Types.BufferUsage.index
        });
        let uniforms;
        if (data.uniforms.size > 0)
            uniforms = this.setUniforms(pipeline, data, opt);
        let perspective = false;
        if (opt.perspective) {
            perspective = true;
        }
        let oldData = {};
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
    append(name, func) {
        this.objects.set(name, {
            function: func,
            attributes: {}
        });
        return this;
    }
    setAttributes(name, attributes) {
        if (!this.objects.has(name)) {
            console.warn(`object ${name} does not exist`);
            return this;
        }
        this.objects.get(name).attributes = Object.assign(Object.assign({}, this.objects.get(name).attributes), attributes);
        return this;
    }
    remove() { }
    draw() {
        var _a, _b;
        if (!this.renderPassDescriptor)
            return;
        this.setRenderPassDescriptorView(this.renderPassDescriptor, true);
        const encoder = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createCommandEncoder();
        if (!encoder)
            return;
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        for (let el of this.objects.values())
            el.function(el.attributes, pass);
        pass.end();
        (_b = this.device) === null || _b === void 0 ? void 0 : _b.queue.submit([encoder.finish()]);
    }
}

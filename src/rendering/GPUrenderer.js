import { WebGPU } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import * as Types from './types.js';
export class Renderer extends WebGPU {
    constructor() {
        super(...arguments);
        this.objects = new Map();
    }
    async init() {
        await super.init();
        this.view = new ViewDelegate(this.cvs.width / this.cvs.height);
        this.renderPassDescriptor = this.createRenderPassDescriptor(true);
        return this;
    }
    setUniforms(pipeline, data) {
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
            data: new Float32Array([])
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
        const count = this.getPrimitivesVertexCount(Types.Primitives.triangles);
        if (!opt.indices) {
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
            uniforms = this.setUniforms(pipeline, data);
        let perspective = false;
        if (opt.perspective) {
            perspective = true;
        }
        let oldData;
        return (opt, pass) => {
            var _a, _b, _c;
            if (uniforms) {
                if (JSON.stringify(oldData) !== JSON.stringify(opt)) {
                    const mat = ((_a = this.view) === null || _a === void 0 ? void 0 : _a.getTransformationMatrix(opt)) || [];
                    uniforms.data = new Float32Array(perspective ? [...(_b = this.view) === null || _b === void 0 ? void 0 : _b.perspectiveMatrix, ...mat] : mat);
                    oldData = opt;
                }
                (_c = this.device) === null || _c === void 0 ? void 0 : _c.queue.writeBuffer(uniforms.buffer, 0, uniforms.data);
                pass.setBindGroup(0, uniforms.bindGroup);
            }
            pass.setPipeline(pipeline);
            pass.setIndexBuffer(indexBuffer, 'uint16');
            pass.setVertexBuffer(0, vertexBuffer);
            pass.drawIndexed(N_OF_VERTICES);
        };
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

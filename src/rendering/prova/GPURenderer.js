import { WebGPU } from "./GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import * as Types from './generics.js';
export class Renderer extends WebGPU {
    constructor() {
        super(...arguments);
        this.functions = [];
    }
    async init() {
        await super.init();
        this.renderPassDescriptor = this.createRenderPassDescriptor(true);
        return this;
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
            opt.indices = [];
            for (let i = 0; i < opt.vertices.length / 3; i++)
                opt.indices.push(i);
        }
        const N_OF_VERTICES = opt.indices.length;
        const indexBuffer = this.createBuffer({
            data: opt.indices,
            dataType: Types.BufferDataType.uint16,
            label: 'index buffer',
            usage: GPUBufferUsage.INDEX
        });
        return (pass) => {
            pass.setPipeline(pipeline);
            pass.setIndexBuffer(indexBuffer, 'uint16');
            pass.setVertexBuffer(0, vertexBuffer);
            pass.drawIndexed(N_OF_VERTICES);
        };
    }
    append(func) {
        this.functions.push(func);
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
        for (let func of this.functions)
            func(pass);
        pass.end();
        (_b = this.device) === null || _b === void 0 ? void 0 : _b.queue.submit([encoder.finish()]);
    }
}

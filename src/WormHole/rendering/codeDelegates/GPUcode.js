import * as Types from "../types.js";
import * as Model from "../rendererModel.js";
export class WebGPU extends Model.Renderer {
    get culling() { return this._culling; }
    set culling(value) {
        this._culling = value;
    }
    get antialias() {
        return this._antialias === 4;
    }
    set antialias(value) {
        if (value)
            this._antialias = 4;
        else
            this._antialias = 1;
    }
    constructor(cvs) {
        super();
        this.cvs = cvs;
        this._culling = false;
        this._antialias = 4;
        this.clearColor = {
            r: 0,
            g: 0,
            b: 0,
            a: 1
        };
        this.ctx = this.cvs.getContext('webgpu');
        if (!this.ctx)
            this.error('context', Types.RendererErrorType.acquisition);
        if (!navigator.gpu)
            throw 'webgpu not enabled';
    }
    async init() {
        var _a;
        this.adapter = await ((_a = navigator.gpu) === null || _a === void 0 ? void 0 : _a.requestAdapter());
        if (!this.adapter) {
            this.error('adapter', Types.RendererErrorType.acquisition);
        }
        this.device = await this.adapter.requestDevice();
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        this.depthTexture = this.createTexture({ format: 'depth24plus', sampled: true });
        this.ctx.configure({
            device: this.device,
            format: this.canvasFormat,
            alphaMode: 'opaque'
        });
        this.renderTarget = this.createTexture({ format: this.canvasFormat, sampled: true });
        return this;
    }
    getPrimitive(primitive) {
        switch (primitive) {
            case Types.Primitives.lines: return 'line-list';
            case Types.Primitives.lines_strip: return 'line-strip';
            case Types.Primitives.triangles: return 'triangle-list';
            case Types.Primitives.triangles_strip: return 'triangle-strip';
            default: return 'point-list';
        }
    }
    getBufferUsage(bufferUsage) {
        switch (bufferUsage) {
            case Types.BufferUsage.vertex: return GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
            case Types.BufferUsage.index: return GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST;
            case Types.BufferUsage.uniform: return GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
        }
    }
    createBufferData(buffer) {
        const format = buffer.components > 1 ?
            `${buffer.dataType}x${buffer.components}`
            : buffer.dataType;
        return {
            shaderLocation: buffer.shaderLocation,
            format: format,
            offset: buffer.offset
        };
    }
    createEntriesDescription(buffers) {
        const entries = [];
        for (let el of buffers) {
            let resource;
            if (el.texture instanceof GPUTexture) {
                resource = el.texture.createView();
            }
            else if (el.texture instanceof GPUExternalTexture || el.texture instanceof GPUSampler || el.texture instanceof GPUTextureView) {
                resource = el.texture;
            }
            else if (el.buffer) {
                resource = {
                    buffer: el.buffer,
                };
            }
            else {
                this.error(`bind group (uncaught type ${el.texture} for resources )`, Types.RendererErrorType.creation);
            }
            entries.push({
                binding: el.location,
                resource: resource
            });
        }
        return entries;
    }
    createUniformBindingGroup(opt) {
        var _a;
        const entries = this.createEntriesDescription(opt.buffers);
        const bindGroup = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createBindGroup({
            layout: opt.pipeline.getBindGroupLayout(0),
            entries
        });
        if (!bindGroup)
            this.error('bind group', Types.RendererErrorType.creation);
        return bindGroup;
    }
    /**
     *
     * @param buffers generic buffer data
     * @param stride total length of the struct (also bytes)
     */
    vertexAttributeDescription(buffers, stride) {
        const attributes = [];
        for (let el of buffers)
            attributes.push(this.createBufferData(el));
        return {
            arrayStride: stride,
            attributes,
            stepMode: 'vertex',
        };
    }
    bufferDescription(arrayByteLength, usage, label = 'buffer', mapped = false) {
        return {
            label: label,
            size: (arrayByteLength + 3) & ~3,
            usage: usage | GPUBufferUsage.COPY_DST,
            mappedAtCreation: mapped,
        };
    }
    mapBuffer(buffer, data) {
        new (Object.getPrototypeOf(data).constructor)(buffer.getMappedRange()).set(data);
        buffer.unmap();
    }
    createTexture(opt) {
        var _a;
        const texture = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createTexture({
            size: [
                opt.width || this.cvs.width,
                opt.height || this.cvs.height,
                1
            ],
            format: opt.format || this.canvasFormat,
            sampleCount: opt.sampled ? this._antialias : 1,
            usage: opt.usage || GPUTextureUsage.RENDER_ATTACHMENT,
        });
        if (!texture)
            this.error(`texture ${opt.format}`, Types.RendererErrorType.creation);
        return texture;
    }
    pipelineDescription(opt) {
        const shaderModule = this.createShader(opt.vShader + opt.fShader);
        const description = {
            vertex: {
                module: shaderModule,
                entryPoint: opt.vEntryPoint || 'vertex_shader',
                buffers: [this.vertexAttributeDescription(opt.buffers, opt.stride)],
            },
            fragment: {
                module: shaderModule,
                entryPoint: opt.fEntryPoint || 'fragment_shader',
                targets: [{
                        format: this.canvasFormat
                    }]
            },
            primitive: {
                topology: this.getPrimitive(opt.topology || Types.Primitives.triangles),
                cullMode: (this._culling ? 'back' : 'none'),
            },
            layout: 'auto',
            multisample: {
                count: this._antialias
            }
        };
        if (opt.enableDepth) {
            return Object.assign(Object.assign({}, description), { depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus',
                } });
        }
        return description;
    }
    setRenderPassDescriptorView(renderPassDescriptor, enableDepth = true) {
        var _a;
        /*if( enableDepth && renderPassDescriptor.depthStencilAttachment )
              renderPassDescriptor.depthStencilAttachment.view = this.depthTexture?.createView() as GPUTextureView;*/
        if (this._antialias === 1) {
            renderPassDescriptor.colorAttachments[0].view = this.ctx.getCurrentTexture().createView();
            return renderPassDescriptor;
        }
        renderPassDescriptor.colorAttachments[0].view = (_a = this.renderTarget) === null || _a === void 0 ? void 0 : _a.createView();
        renderPassDescriptor.colorAttachments[0].resolveTarget = this.ctx.getCurrentTexture().createView();
        return renderPassDescriptor;
    }
    createRenderPassDescriptor(enableDepth) {
        var _a, _b;
        const description = {
            colorAttachments: [{
                    view: this.ctx.getCurrentTexture().createView(),
                    clearValue: this.clearColor,
                    loadOp: 'clear',
                    storeOp: 'store'
                }],
        };
        if (this._antialias == 4) {
            description.colorAttachments[0].view = (_a = this.renderTarget) === null || _a === void 0 ? void 0 : _a.createView();
            description.colorAttachments[0].resolveTarget = this.ctx.getCurrentTexture().createView();
        }
        if (enableDepth)
            return Object.assign(Object.assign({}, description), { depthStencilAttachment: {
                    view: (_b = this.depthTexture) === null || _b === void 0 ? void 0 : _b.createView(),
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: "store",
                } });
        return description;
    }
    createBuffer(opt) {
        var _a;
        let length = 0;
        let mapped = false;
        let constructor = Float32Array;
        if (!opt.data && !opt.arrayByteLength) {
            throw `Buffer cannot be created. Missing data property or arrayByteLength property`;
        }
        if (opt.arrayByteLength)
            length = opt.arrayByteLength;
        else if (opt.data) {
            mapped = true;
            constructor = this.getTypedArrayInitializer(opt.dataType || Types.BufferDataType.float32);
            length = opt.data.length * constructor.BYTES_PER_ELEMENT;
        }
        const descriptor = this.bufferDescription(length, this.getBufferUsage(opt.usage || Types.BufferUsage.vertex), opt.label || 'buffer', mapped);
        const buffer = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createBuffer(descriptor);
        if (!buffer)
            this.error('buffer', Types.RendererErrorType.creation);
        if (opt.data) {
            this.mapBuffer(buffer, new constructor(opt.data));
        }
        return buffer;
    }
    createPipeline(opt) {
        var _a;
        const pipelineDescription = this.pipelineDescription(opt);
        const pipeline = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createRenderPipeline(pipelineDescription);
        if (!pipeline)
            this.error('pipeline', Types.RendererErrorType.creation);
        return pipeline;
    }
    createShader(srcCode) {
        var _a;
        const shader = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createShaderModule({ code: srcCode });
        if (!shader)
            this.error('shader', Types.RendererErrorType.creation);
        return shader;
    }
}

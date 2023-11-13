export class WebGPUCodeDelegate {
    constructor(cvs) {
        this.cvs = cvs;
        this._culling = false;
        this.ctx = cvs.getContext('webgpu');
        if (!this.ctx) {
            throw 'fallback to webgl';
        }
    }
    async configure() {
        var _a;
        this.adapter = await ((_a = navigator.gpu) === null || _a === void 0 ? void 0 : _a.requestAdapter());
        if (!this.adapter) {
            throw 'error while getting webgpu adapter';
        }
        this.device = await this.adapter.requestDevice();
        if (navigator.gpu) {
            this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
            this.ctx.configure({
                device: this.device,
                format: this.canvasFormat,
            });
        }
        return this;
    }
    createBufferLayout(typeFormat) {
        return {
            shaderLocation: 0,
            offset: 0,
            format: typeFormat
        };
    }
    createBuffer(arrayByteLength, usage, mapped = false, label = 'vertex buffer') {
        var _a;
        const bufferDescription = {
            label: label,
            size: (arrayByteLength + 3) & ~3,
            usage: usage | GPUBufferUsage.COPY_DST,
            mappedAtCreation: mapped,
        };
        const buffer = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createBuffer(bufferDescription);
        if (!buffer) {
            throw `something went wrong in buffer ${label} creation`;
        }
        return buffer;
    }
    createMappedBuffer(arr, usage, label = 'vertex buffer') {
        const buffer = this.createBuffer(arr.byteLength, usage, true, label);
        if (!buffer) {
            throw `something went wrong in buffer ${label} creation`;
        }
        const writeArray = new (Object.getPrototypeOf(arr).constructor)(buffer.getMappedRange());
        writeArray.set(arr);
        buffer.unmap();
        return buffer;
    }
    createBindGroup(pipeline, bindings) {
        var _a;
        const entries = [];
        for (let i = 0; i < bindings.length; i++) {
            entries.push({
                binding: i,
                resource: bindings[i]
            });
        }
        const bindGroup = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries,
        });
        if (!bindGroup)
            throw 'something went wrong in bind group creation';
        return bindGroup;
    }
    getVertexBufferLayout(attributes, offset) {
        return {
            attributes: attributes,
            arrayStride: offset,
            stepMode: 'vertex'
        };
    }
    createTexture(img) {
        var _a, _b;
        const texture = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createTexture({
            size: [img.width, img.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        if (!texture)
            throw 'something went wrong in texture creation';
        (_b = this.device) === null || _b === void 0 ? void 0 : _b.queue.copyExternalImageToTexture({ source: img, flipY: true }, { texture }, { width: img.width, height: img.height });
        return texture;
    }
    createSampler() {
        var _a;
        const sampler = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createSampler();
        if (!sampler)
            throw 'something went wrong in sampler creation';
        return sampler;
    }
    createShaderModules(shaderInfo) {
        var _a;
        const shaders = shaderInfo.get();
        const shaderCode = shaders.vertex + shaders.fragment;
        const shaderModule = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createShaderModule({
            code: shaderCode,
        });
        if (!shaderModule)
            throw 'something went wrong in shader creation';
        return shaderModule;
    }
    createPipelineDescription(shaderModule, layout) {
        if (!this.canvasFormat)
            throw 'canvas format not defined';
        return {
            vertex: {
                module: shaderModule,
                entryPoint: "vertex_shader",
                buffers: [layout],
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
                cullMode: this._culling ? 'back' : 'none',
                topology: 'triangle-list',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
            layout: "auto",
        };
    }
    createDepthTexture() {
        var _a;
        const depthTexture = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createTexture({
            size: [this.cvs.width, this.cvs.height, 1],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        if (!depthTexture)
            throw 'something went wrong in creating depth texture';
        return depthTexture;
    }
    createRenderPassDescription(color = { r: 0, g: 0, b: 0, a: 0 }) {
        return {
            label: 'canvas renderPass',
            colorAttachments: [
                {
                    view: this.ctx.getCurrentTexture().createView(),
                    clearValue: [color.r, color.g, color.b, color.a],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.createDepthTexture().createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };
    }
}

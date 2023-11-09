/**
*
* @hideconstructor
*/
export class WebGPURenderer {
    constructor(cvs) {
        this._culling = false;
        this.ctx = cvs.getContext('webgpu');
        if (!this.ctx) {
            throw 'fallback to webgl';
        }
    }
    static async new(cvs) {
        var _a;
        const renderer = new WebGPURenderer(cvs);
        renderer.adapter = await ((_a = navigator.gpu) === null || _a === void 0 ? void 0 : _a.requestAdapter());
        if (!renderer.adapter) {
            throw 'error while getting webgpu adapter';
        }
        renderer.device = await renderer.adapter.requestDevice();
        if (navigator.gpu) {
            renderer.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
            renderer.ctx.configure({
                device: renderer.device,
                format: renderer.canvasFormat,
            });
            renderer.encoder = renderer.device.createCommandEncoder();
        }
        return renderer;
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
    createMergedBuffer(shaderInfos, numberOfVertices) {
        var _a;
        const arr = [];
        for (let i = 0; i < numberOfVertices; i++) {
            for (let el of shaderInfos.attributesData) {
                if (!el.data)
                    continue;
                arr.push(...el.data.slice(i * el.components, (i + 1) * el.components));
            }
        }
        const vertex = new Float32Array(arr);
        const buffer = this.createBuffer(vertex.byteLength, GPUBufferUsage.VERTEX);
        if (!buffer)
            throw `something went wrong in buffer creation`;
        (_a = this.device) === null || _a === void 0 ? void 0 : _a.queue.writeBuffer(buffer, 0, vertex);
        return buffer;
    }
    createBindGroup(pipeline, buffer, bindingLocation) {
        var _a;
        return (_a = this.device) === null || _a === void 0 ? void 0 : _a.createBindGroup({
            layout: pipeline.getBindGroupLayout(bindingLocation),
            entries: [
                {
                    binding: bindingLocation,
                    resource: { buffer: buffer }
                },
            ],
        });
    }
    getAttributeInfos(shaderInfo) {
        const attributesInfo = [];
        for (let el of shaderInfo.attributesData) {
            attributesInfo.push({
                shaderLocation: el.bindingLocation,
                offset: el.offset,
                format: el.type,
            });
        }
        return attributesInfo;
    }
    getVertexBufferLayout(shaderInfo) {
        const attributes = this.getAttributeInfos(shaderInfo);
        const lastAttributeInfo = shaderInfo.attributesData[shaderInfo.attributesData.length - 1];
        const stride = lastAttributeInfo.offset + lastAttributeInfo.size * lastAttributeInfo.components;
        return {
            attributes: attributes,
            arrayStride: stride,
            stepMode: 'vertex'
        };
    }
    createUniform(shaderInfo) {
        const lastUniformInfo = shaderInfo.uniformsData[shaderInfo.uniformsData.length - 1];
        const uniformBufferSize = lastUniformInfo.offset + lastUniformInfo.size * lastUniformInfo.components;
        const buffer = this.createBuffer(uniformBufferSize * 4, GPUBufferUsage.UNIFORM, false, 'uniform buffer');
        if (!buffer) {
            throw 'something went wrong in uniform buffer creation';
        }
        let comp = 0;
        for (const el of shaderInfo.uniformsData) {
            if (!el.data)
                continue;
            comp += el.numberOfComponents;
        }
        const uniformsArray = new Float32Array(comp);
        let loaded = 0;
        for (const el of shaderInfo.uniformsData) {
            if (!el.data)
                continue;
            uniformsArray.set(el.data, loaded);
            loaded += el.numberOfComponents;
        }
        return {
            buffer,
            data: uniformsArray
        };
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
    createPipelineDescription(shaderInfo) {
        const shaderModule = this.createShaderModules(shaderInfo);
        if (!this.canvasFormat)
            throw 'canvas format not defined';
        return {
            vertex: {
                module: shaderModule,
                entryPoint: "vertex_shader",
                buffers: [this.getVertexBufferLayout(shaderInfo)],
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
                cullMode: this._culling ? 'front' : 'none',
                topology: "triangle-list",
            },
            layout: "auto",
        };
    }
    createRenderingPipeline(shaderInfo) {
        var _a;
        const pipelineDescriptor = this.createPipelineDescription(shaderInfo);
        console.log(pipelineDescriptor);
        const pipeline = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createRenderPipeline(pipelineDescriptor);
        if (!pipeline) {
            throw 'something went wrong in pipeline creation';
        }
        return pipeline;
    }
    getNumberOfVertices(shaderInfo) {
        let v = 0;
        for (let el of shaderInfo.attributesData) {
            if (!el.data)
                throw `attributes ${el.name} have no array binding`;
            if (v && el.data.length / el.numberOfComponents == v)
                continue;
            else if (v) {
                if (v > el.data.length / el.numberOfComponents)
                    throw `attributes ${el.name} array is to much short`;
                else
                    throw `attributes ${el.name} array is to much long`;
            }
            v = el.data.length / el.numberOfComponents;
        }
        return v;
    }
    setup(shaderInfo, indices) {
        const renderPassDescriptor = {
            label: 'our basic canvas renderPass',
            colorAttachments: [
                {
                    view: this.ctx.getCurrentTexture().createView(),
                    clearValue: [0.3, 0.3, 0.3, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };
        const N = this.getNumberOfVertices(shaderInfo);
        if (!N) {
            return;
        }
        const pipeline = this.createRenderingPipeline(shaderInfo);
        const vertexBuffer = this.createMergedBuffer(shaderInfo, N);
        const indicesArray = new Uint16Array(indices);
        const indexBuffer = this.createMappedBuffer(indicesArray, GPUBufferUsage.INDEX, 'index buffer');
        const { buffer, data } = this.createUniform(shaderInfo);
        if (!indexBuffer || !buffer) {
            throw 'something went wrong in buffer creation';
        }
        const bindGroup = this.createBindGroup(pipeline, buffer, 0);
        if (!bindGroup) {
            throw 'something went wrong in bind group creation';
        }
        return () => {
            var _a, _b, _c, _d;
            const pass = (_a = this.encoder) === null || _a === void 0 ? void 0 : _a.beginRenderPass(renderPassDescriptor);
            pass === null || pass === void 0 ? void 0 : pass.setPipeline(pipeline);
            pass === null || pass === void 0 ? void 0 : pass.setVertexBuffer(0, vertexBuffer);
            pass === null || pass === void 0 ? void 0 : pass.setIndexBuffer(indexBuffer, 'uint16');
            pass === null || pass === void 0 ? void 0 : pass.setBindGroup(0, bindGroup);
            (_b = this.device) === null || _b === void 0 ? void 0 : _b.queue.writeBuffer(buffer, 0, data);
            pass === null || pass === void 0 ? void 0 : pass.drawIndexed(N);
            pass === null || pass === void 0 ? void 0 : pass.end();
            const commandBuffer = (_c = this.encoder) === null || _c === void 0 ? void 0 : _c.finish();
            if (!commandBuffer)
                return;
            (_d = this.device) === null || _d === void 0 ? void 0 : _d.queue.submit([commandBuffer]);
        };
    }
    enableCulling() {
        this._culling = !this._culling;
    }
}

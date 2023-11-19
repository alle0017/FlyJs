import { WebGPU } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import { UniformsName as UN, BindingsName as BN } from './shaders/shaderModel.js';
import * as Types from './types.js';
import { UNIFORM } from "./shaders/GPUShader.js";
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
    setIndexArray(vertices, primitive) {
        const count = this.getPrimitivesVertexCount(primitive);
        const indices = [];
        for (let i = 0; i < vertices / count; i++)
            indices.push(i);
        return indices;
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
        console.log('no uniform');
        if (!opt.uniforms.buffer)
            return (drawOpt, pass) => {
                pass.setBindGroup(0, opt.uniforms.bindGroup);
                pass.setPipeline(opt.pipeline);
                defaultRenderFunc(pass);
            };
        console.log('no buffer');
        const uniforms = (drawOpt, pass) => {
            var _a;
            if (JSON.stringify(opt.oldData) !== JSON.stringify(drawOpt)) {
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
    }
    useImage(image) {
        var _a, _b;
        const texture = this.createTexture({
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
            width: image.width,
            height: image.height,
            format: 'rgba8unorm'
        });
        (_a = this.device) === null || _a === void 0 ? void 0 : _a.queue.copyExternalImageToTexture({ source: image, flipY: true }, { texture }, { width: image.width, height: image.height });
        const sampler = (_b = this.device) === null || _b === void 0 ? void 0 : _b.createSampler();
        return {
            sampler: sampler,
            texture: texture,
        };
    }
    setUniforms(pipeline, stride, bindings, imageData) {
        const buffers = [];
        let buffer;
        const funcs = {
            [BN.displacementMap]: (resource) => {
                if (imageData && imageData.displacementMap)
                    resource.texture = this.useImage(imageData.displacementMap).texture.createView();
            },
            [BN.texture]: (resource) => {
                if (imageData)
                    resource.texture = this.useImage(imageData.image).texture.createView();
            },
            [BN.textureSampler]: (resource) => {
                var _a;
                resource.texture = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createSampler();
            },
            [UNIFORM]: (resource) => {
                buffer = this.createBuffer({
                    arrayByteLength: stride,
                    usage: Types.BufferUsage.uniform,
                });
                resource.buffer = buffer;
            }
        };
        for (let i = 0; i < bindings.length; i++) {
            const resource = {
                location: i,
            };
            if (funcs[bindings[i].name]) {
                funcs[bindings[i].name](resource);
            }
            else {
                this.error(`uniform bind group (name ${bindings[i].name} not recognized)`, Types.RendererErrorType.initialization);
            }
            buffers.push(resource);
        }
        const bindGroup = this.createUniformBindingGroup({
            pipeline,
            buffers
        });
        return {
            buffer,
            bindGroup,
            data: new Float32Array([]),
        };
    }
    setProgramAttributes(opt) {
        const data = ProgramSetterDelegate.getProperties(opt, Types.ProgramMode.webgpu);
        const pipeline = this.createPipeline({
            vShader: data.vertex,
            fShader: data.fragment,
            buffers: [...data.attributes.values()],
            stride: data.attributeStride,
            enableDepth: true,
            topology: opt.primitive || Types.Primitives.triangles
        });
        const vertexBuffer = this.createBuffer({
            data: data.unifiedAttributeBuffer,
            dataType: Types.BufferDataType.float32,
            label: 'vertex buffer',
        });
        if (!opt.indices) {
            opt.indices = this.setIndexArray(opt.vertices.length, opt.primitive || Types.Primitives.triangles);
        }
        const N_OF_VERTICES = opt.indices.length;
        const indexBuffer = this.createBuffer({
            data: opt.indices,
            dataType: Types.BufferDataType.uint16,
            label: 'index buffer',
            usage: Types.BufferUsage.index
        });
        let uniforms;
        if (data.bindings && data.bindings.length > 0)
            uniforms = this.setUniforms(pipeline, data.uniformStride, data.bindings, opt.imageData);
        return {
            pipeline,
            vertexBuffer,
            N_OF_VERTICES,
            indexBuffer,
            uniforms,
            uniformsName: data.uniformsName,
        };
    }
    create(opt) {
        return this.createRenderFunction(Object.assign(Object.assign({}, this.setProgramAttributes(opt)), { perspective: opt.perspective || false, oldData: {} }));
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
    remove(name) {
        var _a;
        if (!this.objects.has(name)) {
            console.warn(`object ${name} does not exist`);
            return;
        }
        const func = (_a = this.objects.get(name)) === null || _a === void 0 ? void 0 : _a.function;
        this.objects.delete(name);
        return func;
    }
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

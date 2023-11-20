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
            var _a, _b, _c;
            //if( JSON.stringify( opt.oldData ) !== JSON.stringify( drawOpt ) ){
            const arrays = this.getUniformsData(opt.uniformsName, drawOpt, opt.uniforms);
            opt.oldData = drawOpt;
            (_a = this.device) === null || _a === void 0 ? void 0 : _a.queue.writeBuffer(opt.uniforms.buffer, 0, new Float32Array(arrays.uniformArray));
            if ((_b = opt.uniforms) === null || _b === void 0 ? void 0 : _b.boneBuffer) {
                (_c = this.device) === null || _c === void 0 ? void 0 : _c.queue.writeBuffer(opt.uniforms.boneBuffer, 0, new Float32Array(arrays.boneArray));
            }
            //}
            pass.setBindGroup(0, opt.uniforms.bindGroup);
        };
        return (drawOpt, pass) => {
            pass.setPipeline(opt.pipeline);
            uniforms(drawOpt, pass);
            defaultRenderFunc(pass);
        };
    }
    getUniformsData(uniformsName, opt, uniforms) {
        var _a;
        const uniformArray = [];
        const boneArray = [];
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
        if (opt.bones) {
            opt.bones.forEach(el => {
                boneArray.push(...el);
            });
        }
        else if (uniforms.boneBuffer) {
            for (let i = 0; i < ((_a = uniforms.boneBuffer) === null || _a === void 0 ? void 0 : _a.size) / 4; i++)
                boneArray.push(0);
        }
        return {
            uniformArray,
            boneArray,
        };
    }
    useImage(image) {
        var _a;
        const texture = this.createTexture({
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
            width: image.width,
            height: image.height,
            format: 'rgba8unorm'
        });
        (_a = this.device) === null || _a === void 0 ? void 0 : _a.queue.copyExternalImageToTexture({ source: image, flipY: true }, { texture }, { width: image.width, height: image.height });
        return texture;
    }
    setUniforms(pipeline, stride, bindings, imageData, bones) {
        const buffers = [];
        let buffer;
        let boneBuffer;
        const funcs = {
            [BN.displacementMap]: (resource) => {
                if (imageData && imageData.displacementMap)
                    resource.texture = this.useImage(imageData.displacementMap).createView();
            },
            [BN.texture]: (resource) => {
                if (imageData)
                    resource.texture = this.useImage(imageData.image).createView();
            },
            [BN.textureSampler]: (resource) => {
                var _a;
                resource.texture = (_a = this.device) === null || _a === void 0 ? void 0 : _a.createSampler();
            },
            [BN.bones]: (resource) => {
                if (!bones)
                    this.error(`uniform bind group (bones number not defined)`, Types.RendererErrorType.initialization);
                boneBuffer = this.createBuffer({
                    // 16 elements for each matrix
                    arrayByteLength: Float32Array.BYTES_PER_ELEMENT * 16 * bones,
                    usage: Types.BufferUsage.uniform
                });
                resource.buffer = boneBuffer;
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
            if (funcs[bindings[i]]) {
                funcs[bindings[i]](resource);
            }
            else {
                this.error(`uniform bind group (name ${bindings[i]} not recognized)`, Types.RendererErrorType.initialization);
            }
            buffers.push(resource);
        }
        const bindGroup = this.createUniformBindingGroup({
            pipeline,
            buffers
        });
        return {
            buffer,
            boneBuffer,
            bindGroup,
        };
    }
    setProgramAttributes(opt) {
        var _a;
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
            uniforms = this.setUniforms(pipeline, data.uniformStride, data.bindings, opt.imageData, ((_a = opt.bonesData) === null || _a === void 0 ? void 0 : _a.bones) || 0);
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
    setToAll(attributes) {
        for (let el of this.objects.keys()) {
            this.setAttributes(el, attributes);
        }
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

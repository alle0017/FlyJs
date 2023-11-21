import { WebGPU } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import { UniformsName as UN, BindingsName as BN } from './shaders/shaderModel.js';
import { UNIFORM } from "./shaders/GPUShader.js";
import { ProgramMode, BufferDataType, BufferUsage, Primitives, RendererErrorType } from './types.js';
import { Matrix } from "./matrix/matrices.js";
export class WebGPURenderer extends WebGPU {
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
            return (arrays, pass) => {
                pass.setPipeline(opt.pipeline);
                defaultRenderFunc(pass);
            };
        if (!opt.uniforms.buffer)
            return (arrays, pass) => {
                pass.setBindGroup(0, opt.uniforms.bindGroup);
                pass.setPipeline(opt.pipeline);
                defaultRenderFunc(pass);
            };
        const uniforms = (arrays, pass) => {
            var _a, _b, _c;
            (_a = this.device) === null || _a === void 0 ? void 0 : _a.queue.writeBuffer(opt.uniforms.buffer, 0, new Float32Array(arrays.transformations));
            if ((_b = opt.uniforms) === null || _b === void 0 ? void 0 : _b.boneBuffer) {
                console.log(arrays.bones);
                (_c = this.device) === null || _c === void 0 ? void 0 : _c.queue.writeBuffer(opt.uniforms.boneBuffer, 0, new Float32Array(arrays.bones));
            }
            pass.setBindGroup(0, opt.uniforms.bindGroup);
        };
        return (arrays, pass) => {
            pass.setPipeline(opt.pipeline);
            uniforms(arrays, pass);
            defaultRenderFunc(pass);
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
    initUniformsBuffers(pipeline, stride, bindings, imageData, bones) {
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
                    this.error(`uniform bind group (bones number not defined)`, RendererErrorType.initialization);
                boneBuffer = this.createBuffer({
                    // 16 elements for each matrix
                    arrayByteLength: Float32Array.BYTES_PER_ELEMENT * 16 * bones,
                    usage: BufferUsage.uniform
                });
                resource.buffer = boneBuffer;
            },
            [UNIFORM]: (resource) => {
                buffer = this.createBuffer({
                    arrayByteLength: stride,
                    usage: BufferUsage.uniform,
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
                this.error(`uniform bind group (name ${bindings[i]} not recognized)`, RendererErrorType.initialization);
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
        const data = ProgramSetterDelegate.getProperties(opt, ProgramMode.webgpu);
        const pipeline = this.createPipeline({
            vShader: data.vertex,
            fShader: data.fragment,
            buffers: [...data.attributes.values()],
            stride: data.attributeStride,
            enableDepth: true,
            topology: opt.primitive || Primitives.triangles
        });
        const vertexBuffer = this.createBuffer({
            data: data.unifiedAttributeBuffer,
            dataType: BufferDataType.float32,
            label: 'vertex buffer',
        });
        if (!opt.indices) {
            opt.indices = this.setIndexArray(opt.vertices.length, opt.primitive || Primitives.triangles);
        }
        const N_OF_VERTICES = opt.indices.length;
        const indexBuffer = this.createBuffer({
            data: opt.indices,
            dataType: BufferDataType.uint16,
            label: 'index buffer',
            usage: BufferUsage.index
        });
        let uniforms;
        if (data.bindings && data.bindings.length > 0)
            uniforms = this.initUniformsBuffers(pipeline, data.uniformStride, data.bindings, opt.imageData, ((_a = opt.bonesData) === null || _a === void 0 ? void 0 : _a.bones) || 0);
        return {
            renderFunctionAttribs: {
                pipeline,
                vertexBuffer,
                N_OF_VERTICES,
                indexBuffer,
                uniforms,
            },
            uniformsName: data.uniformsName,
        };
    }
    initArrays(opt) {
        var _a, _b;
        const bonesMatrix = [];
        const bones = [];
        if (opt.bonesData) {
            for (let i = 0; i < opt.bonesData.bones; i++) {
                bonesMatrix.push(...Matrix.IDENTITY_4X4);
                bones.push({
                    inversePose: Matrix.IDENTITY_4X4,
                    transformationMatrix: Matrix.IDENTITY_4X4
                });
            }
        }
        return {
            bones: bonesMatrix,
            transformations: Matrix.IDENTITY_4X4,
            skeleton: {
                root: ((_a = opt.bonesData) === null || _a === void 0 ? void 0 : _a.root) || 0,
                bones,
                indices: ((_b = opt.bonesData) === null || _b === void 0 ? void 0 : _b.indices) || []
            }
        };
    }
    getArrays(bones, uniformsName, opt) {
        const uniformArray = [];
        const bonesArray = [];
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
        if (opt.bones && (opt.bones.angle || opt.bones.translate)) {
            if (!opt.bones.translate) {
                opt.bones.translate = [];
                for (let i = 0; i < opt.bones.angle.length; i++)
                    opt.bones.translate.push({ x: 0, y: 0, z: 0 });
            }
            else if (!opt.bones.angle) {
                opt.bones.angle = [];
                for (let i = 0; i < opt.bones.translate.length; i++)
                    opt.bones.angle.push(0);
            }
            const bonesMatrices = this.view.calculateSkeletonPosition(bones, opt.bones.angle, opt.bones.translate);
            bonesArray.push(...bonesMatrices.reduce((prev, curr) => prev ? prev.concat(curr) : curr));
        }
        return {
            uniformArray,
            bonesArray
        };
    }
    create(opt) {
        const arrays = this.initArrays(opt);
        const attribs = this.setProgramAttributes(opt);
        return {
            function: this.createRenderFunction(Object.assign({}, attribs.renderFunctionAttribs)),
            arrays: {
                bones: arrays.bones,
                transformations: arrays.transformations
            },
            skeleton: arrays.skeleton,
            uniformsName: attribs.uniformsName,
            attributes: {}
        };
    }
    append(name, obj) {
        this.objects.set(name, obj);
        return this;
    }
    setAttributes(name, attributes) {
        if (!this.objects.has(name)) {
            console.warn(`object ${name} does not exist`);
            return this;
        }
        const obj = this.objects.get(name);
        obj.attributes = Object.assign(Object.assign({}, obj.attributes), attributes);
        const arrays = this.getArrays(obj.skeleton, obj.uniformsName, obj.attributes);
        const transformations = arrays.uniformArray.length > 0 ? arrays.uniformArray : obj.arrays.transformations;
        const bones = arrays.bonesArray.length > 0 ? arrays.bonesArray : obj.arrays.bones;
        obj.arrays = {
            bones,
            transformations
        };
        return this;
    }
    setToAll(attributes) {
        for (let el of this.objects.keys()) {
            this.setAttributes(el, attributes);
        }
        return this;
    }
    remove(name) {
        if (!this.objects.has(name)) {
            console.warn(`object ${name} does not exist`);
            return;
        }
        const obj = this.objects.get(name);
        this.objects.delete(name);
        return obj;
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
            el.function(el.arrays, pass);
        pass.end();
        (_b = this.device) === null || _b === void 0 ? void 0 : _b.queue.submit([encoder.finish()]);
    }
}

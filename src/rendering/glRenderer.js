import { WebGL } from './codeDelegates/GLcode.js';
import { ProgramMode, BufferDataType, BufferUsage, Primitives, RendererErrorType, } from './types.js';
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { UniformsName as UN, BindingsName as BN } from './shaders/shaderModel.js';
import { ViewDelegate } from './matrix/viewMatrix.js';
export class Renderer extends WebGL {
    get culling() {
        return this._culling;
    }
    set culling(value) {
        if (value === this._culling)
            return;
        if (value) {
            this.gl.enable(this.gl.CULL_FACE);
            this.gl.cullFace(this.gl.FRONT_AND_BACK);
        }
        else {
            this.gl.disable(this.gl.CULL_FACE);
        }
    }
    get clearColor() {
        return this._clearColor;
    }
    set clearColor(value) {
        if (this._clearColor.r === value.r ||
            this._clearColor.g === value.g ||
            this._clearColor.b === value.b ||
            this._clearColor.a === value.a)
            return;
        this._clearColor = value;
        this.gl.clearColor(value.r, value.g, value.b, value.a);
    }
    constructor(cvs) {
        super(cvs);
        this.objects = new Map();
        this._clearColor = { r: 0, g: 0, b: 0, a: 1 };
        this._culling = false;
        this.view = new ViewDelegate(cvs.width / cvs.height);
    }
    async init() {
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
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
        const defaultRenderFunc = () => {
            for (let [key, buffer] of opt.vertexBuffers.entries()) {
                const bufferData = opt.attributes.get(key);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
                this.gl.vertexAttribPointer(bufferData.shaderLocation, bufferData.components, this.gl.FLOAT, false, 0, 0);
                this.gl.enableVertexAttribArray(bufferData.shaderLocation);
            }
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, opt.indexBuffer);
            this.gl.drawElements(opt.primitive, opt.N_OF_VERTICES, this.gl.UNSIGNED_SHORT, 0);
        };
        if (opt.locations.size <= 0)
            return (drawOpt) => {
                this.gl.useProgram(opt.program);
                defaultRenderFunc();
            };
        const uniforms = (drawOpt) => {
            const uniformsData = this.getUniformsData(drawOpt, opt.objOpt);
            let i = 0;
            for (let [key, value] of opt.locations.entries()) {
                const bufferData = opt.uniforms.get(key);
                const texture = key in BN ? opt.textures.get(key) : undefined;
                if (bufferData && uniformsData[key])
                    this.setUniforms(bufferData, value, uniformsData[key]);
                else if (texture && `TEXTURE${i}` in this.gl) {
                    this.gl.uniform1i(value, i);
                    this.gl.activeTexture(this.gl[`TEXTURE${i}`]);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                    i++;
                }
            }
        };
        return (drawOpt) => {
            this.gl.useProgram(opt.program);
            uniforms(drawOpt);
            defaultRenderFunc();
        };
    }
    setUniforms(data, location, value) {
        const type = data.dataType;
        switch (type) {
            case 'vec4':
                this.gl.uniform4fv(location, value);
                break;
            case 'vec3':
                this.gl.uniform3fv(location, value);
                break;
            case 'vec2':
                this.gl.uniform2fv(location, value);
                break;
            case 'int':
                this.gl.uniform1i(location, value);
                break;
            case 'float':
                this.gl.uniform1f(location, value);
                break;
            case 'mat4':
                this.gl.uniformMatrix4fv(location, false, value);
                break;
            case 'mat3':
                this.gl.uniformMatrix3fv(location, false, value);
                break;
            case 'mat2':
                this.gl.uniformMatrix2fv(location, false, value);
                break;
            case 'mat3x2': break;
            default: break;
        }
    }
    getUniformsData(opt, elementAttr) {
        const obj = {};
        if (elementAttr.perspective) {
            obj[UN.perspective] = this.view.perspectiveMatrix;
        }
        if (!elementAttr.static) {
            obj[UN.transformation] = this.view.getTransformationMatrix(opt);
        }
        if (!elementAttr.imageData)
            return obj;
        if (elementAttr.imageData.animate) {
            obj[UN.framePosition] = (opt === null || opt === void 0 ? void 0 : opt.animationVector) || [0, 0];
        }
        if (elementAttr.imageData.displacementMap) {
            obj[UN.bumpScale] = (opt === null || opt === void 0 ? void 0 : opt.bumpScale) || 1;
        }
        return obj;
    }
    createTexture(name, opt) {
        let img;
        if (name === BN.displacementMap && opt.displacementMap)
            img = opt.displacementMap;
        else if (name === BN.texture)
            img = opt.image;
        else {
            this.error(`texture (${name} for texture is not defined in WebGL)`, RendererErrorType.creation);
        }
        const texture = this.gl.createTexture();
        if (!texture)
            this.error('texture', RendererErrorType.creation);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
        return texture;
    }
    createVertexBuffers(program, vertexBuffers, attributes, attributesData) {
        for (let [key, arr] of attributesData.entries()) {
            vertexBuffers.set(key, this.createBuffer({
                data: arr,
            }));
            if (attributes.has(key))
                attributes.get(key).shaderLocation = this.gl.getAttribLocation(program, key);
            else
                this.error(`buffer ${key}`, RendererErrorType.initialization);
        }
    }
    setUniformsLocations(program, uniforms, locations, imageData) {
        const textures = new Map();
        for (const key of uniforms.keys()) {
            const loc = this.gl.getUniformLocation(program, key);
            if (!loc)
                this.error('uniform location', RendererErrorType.acquisition);
            locations.set(key, loc);
            if (key in BN && imageData) { // enums generates also values as key
                textures.set(key, this.createTexture(key, imageData));
            }
        }
        return textures;
    }
    setProgramAttributes(opt) {
        const data = ProgramSetterDelegate.getProperties(opt, ProgramMode.webgl, false);
        const program = this.createProgram({
            vShader: data.vertex,
            fShader: data.fragment,
            buffers: [],
            stride: 0,
        });
        const vertexBuffers = new Map();
        this.createVertexBuffers(program, vertexBuffers, data.attributes, data.attributesData);
        if (!opt.indices) {
            opt.indices = this.setIndexArray(opt.vertices.length, opt.primitive || Primitives.triangles);
        }
        const indexBuffer = this.createBuffer({
            data: opt.indices,
            dataType: BufferDataType.uint16,
            usage: BufferUsage.index,
        });
        const locations = new Map();
        const textures = this.setUniformsLocations(program, data.uniforms, locations, opt.imageData);
        const primitive = this.getPrimitive(Primitives.triangles);
        const N_OF_VERTICES = opt.indices.length;
        return {
            N_OF_VERTICES,
            program,
            vertexBuffers,
            attributes: data.attributes,
            locations,
            uniforms: data.uniforms,
            primitive,
            indexBuffer,
            textures
        };
    }
    create(opt) {
        return this.createRenderFunction(Object.assign(Object.assign({}, this.setProgramAttributes(opt)), { objOpt: opt }));
    }
    append(name, func) {
        this.objects.set(name, {
            function: func,
            attributes: {}
        });
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
    setAttributes(name, opt) {
        if (!this.objects.has(name)) {
            console.warn(`object ${name} does not exist`);
            return this;
        }
        this.objects.get(name).attributes = Object.assign(Object.assign({}, this.objects.get(name).attributes), opt);
        return this;
    }
    draw() {
        for (let el of this.objects.values()) {
            el.function(el.attributes);
        }
    }
}

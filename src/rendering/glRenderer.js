import { WebGL } from './codeDelegates/GLcode.js';
import { ProgramMode, BufferDataType, BufferUsage, Primitives, RendererErrorType, } from './types.js';
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { UniformsName as UN } from './shaders/shaderModel.js';
import { ViewDelegate } from './matrix/viewMatrix.js';
export class Renderer extends WebGL {
    constructor(cvs) {
        super(cvs);
        this.objects = new Map();
        this.view = new ViewDelegate(cvs.width / cvs.height);
    }
    async init() {
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        return this;
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
            for (let [key, value] of opt.locations.entries()) {
                const bufferData = opt.uniforms.get(key);
                if (bufferData && uniformsData[key])
                    this.setUniforms(bufferData, value, uniformsData[key]);
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
    create(opt) {
        const data = ProgramSetterDelegate.getProperties(opt, ProgramMode.webgl, false);
        const program = this.createProgram({
            vShader: data.vertex,
            fShader: data.fragment,
            buffers: [],
            stride: 0,
        });
        const vertexBuffers = new Map();
        for (let [key, arr] of data.attributesData.entries()) {
            vertexBuffers.set(key, this.createBuffer({
                data: arr,
            }));
            if (data.attributes.has(key))
                data.attributes.get(key).shaderLocation = this.gl.getAttribLocation(program, key);
            else
                this.error(`buffer ${key}`, RendererErrorType.initialization);
        }
        if (!opt.indices) {
            const count = this.getPrimitivesVertexCount(Primitives.triangles);
            opt.indices = [];
            for (let i = 0; i < opt.vertices.length / count; i++)
                opt.indices.push(i);
        }
        const indexBuffer = this.createBuffer({
            data: opt.indices,
            dataType: BufferDataType.uint16,
            usage: BufferUsage.index,
        });
        const locations = new Map();
        for (const key of data.uniforms.keys()) {
            const loc = this.gl.getUniformLocation(program, key);
            if (!loc)
                this.error('uniform location', RendererErrorType.acquisition);
            locations.set(key, loc);
        }
        const primitive = this.getPrimitive(Primitives.triangles);
        const N_OF_VERTICES = opt.indices.length;
        return this.createRenderFunction({
            N_OF_VERTICES,
            program,
            vertexBuffers,
            attributes: data.attributes,
            locations,
            uniforms: data.uniforms,
            primitive,
            indexBuffer,
            objOpt: opt
        });
        /*return ( drawOpt?: DrawOpt )=>{
              
              this.gl.useProgram( program );
              for( let [ key, buffer ] of vertexBuffers.entries() ){
                    const bufferData = data.attributes.get( key )!;
                    this.gl.bindBuffer( this.gl.ARRAY_BUFFER, buffer );
                    this.gl.vertexAttribPointer(
                          bufferData.shaderLocation,
                          bufferData.components,
                          this.gl.FLOAT,
                          false, 0, 0 );
                    this.gl.enableVertexAttribArray( bufferData.shaderLocation );
              }
              if( locations.size > 0 ){
                    const uniformsData = this.getUniformsData( drawOpt, opt );
                    for( let [key, value] of locations.entries() ){
                          const bufferData = data.uniforms.get( key );
                          if( bufferData && uniformsData[key as UN] )
                                this.setUniforms( bufferData , value, uniformsData[key as UN]! );
                    }
              }
              this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer );
              this.gl.drawElements( primitive, N_OF_VERTICES, this.gl.UNSIGNED_SHORT, 0);
        }*/
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

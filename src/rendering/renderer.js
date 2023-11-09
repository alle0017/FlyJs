import { WebGLRenderer } from "./glRenderer.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import { ProgramAttributes } from "./programAttributes.js";
export class RendererDelegate extends WebGLRenderer {
    constructor(cvs) {
        const ctx = cvs.getContext('webgl');
        if (!ctx) {
            throw 'something went wrong in canvas initialization (WebGL context)';
        }
        super(ctx);
        this.viewDelegate = new ViewDelegate(cvs.width / cvs.height);
    }
    createBufferData(bufferData) {
        const buffer = bufferData.buffer || this.createBuffer(bufferData.data, bufferData.type, bufferData.staticDraw);
        return {
            attributeName: bufferData.attributeName,
            buffer: buffer,
            data: bufferData.data,
            indices: bufferData.indices || false,
            numberOfComponents: bufferData.numberOfComponents || 3,
            location: bufferData.location || 0,
            type: bufferData.type || this.BUFFER,
            dataType: bufferData.dataType || this.FLOAT,
            stride: bufferData.stride || 0,
            offset: bufferData.offset || 0,
            normalize: bufferData.normalize || false
        };
    }
    createUniform(name, type, value = 0, transpose = false) {
        return {
            name: name,
            transpose: transpose,
            value: value,
            location: 0,
            dataType: type || (typeof value == 'number' ? this.FLOAT : this.MAT4),
        };
    }
    bindUniforms(uniforms) {
        for (let uniform of uniforms) {
            this.bindUniform(uniform);
        }
    }
    bindAttributeBuffers(attributes) {
        for (let attribute of attributes) {
            this.bindAndEnableBuffer(attribute);
        }
    }
    getAttributesLocations(program, buffers) {
        for (let buffer of buffers) {
            buffer.location = this.getAttributeLocation(buffer.attributeName, program);
        }
        return buffers;
    }
    getAttributesData(buffersData) {
        const buffers = [];
        for (let data of buffersData) {
            buffers.push(this.createBufferData(data));
        }
        return buffers;
    }
    getUniformsLocations(program, uniforms) {
        for (let uniform of uniforms) {
            uniform.location = this.getUniformLocation(uniform.name, program);
        }
        return uniforms;
    }
    getDrawFunction(opt) {
        const fillIndex = () => {
            opt.indices = [];
            for (let i = 0; i < opt.vertices.length / 3; i++) {
                opt.indices.push(i);
            }
        };
        if (!opt.indices) {
            fillIndex();
        }
        const programAttributes = new ProgramAttributes(this, opt);
        const program = this.createProgram(programAttributes.vertex, programAttributes.fragment);
        this.getAttributesLocations(program, programAttributes.attributes);
        this.getUniformsLocations(program, programAttributes.uniforms);
        const indexBuffer = this.createBufferData({
            attributeName: '',
            data: new Uint16Array(opt.indices),
            indices: true,
            type: this.INDEX_BUFFER
        });
        return (opt) => {
            this.useProgram(program);
            // Bind buffers for rendering
            this.bindAttributeBuffers(programAttributes.attributes);
            // Bind the indices buffer
            this.bindBuffer(indexBuffer);
            programAttributes.setMatrices(this.viewDelegate.getTransformationMatrix(opt), this.viewDelegate.perspectiveMatrix, opt === null || opt === void 0 ? void 0 : opt.animationVector);
            // Bind uniforms for rendering
            this.bindUniforms(programAttributes.uniforms);
            // Draw elements
            this.draw(indexBuffer.data.length);
        };
    }
}

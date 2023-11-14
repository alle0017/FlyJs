import * as Types from './generics.js';
import * as Model from './rendererModel.js';
export class WebGL extends Model.Renderer {
    get antialias() {
        return this._antialias;
    }
    set antialias(value) {
        if (value !== this._antialias) {
            this._antialias = value;
            this.gl = this.gl.canvas.getContext('webgl', { antialias: this._antialias });
            if (!this.gl) {
                throw 'No Context available';
            }
        }
    }
    constructor(cvs) {
        super();
        this._antialias = false;
        this.gl = cvs.getContext('webgl');
        if (!this.gl) {
            throw 'No Context available';
        }
    }
    getPrimitive(primitive) {
        switch (primitive) {
            case Types.Primitives.lines: return this.gl.LINES;
            case Types.Primitives.lines_strip: return this.gl.LINE_STRIP;
            case Types.Primitives.triangles: return this.gl.TRIANGLES;
            case Types.Primitives.triangles_strip: return this.gl.TRIANGLE_STRIP;
            default: return this.gl.POINTS;
        }
    }
    getBufferUsage(bufferUsage) {
        switch (bufferUsage) {
            case Types.BufferUsage.vertex: return this.gl.ARRAY_BUFFER;
            case Types.BufferUsage.index: return this.gl.ELEMENT_ARRAY_BUFFER;
        }
    }
    createBufferData(arg) {
        throw new Error('Method not implemented.');
    }
    createBuffer(opt) {
        const buffer = this.gl.createBuffer();
        if (!buffer) {
            this.error(`buffer`, Types.RendererErrorType.creation);
        }
        if (opt.data) {
            const constructor = this.getTypedArrayInitializer(opt.dataType || Types.BufferDataType.float32);
            const arr = new constructor(opt.data);
            const usage = this.getBufferUsage(opt.usage || Types.BufferUsage.vertex);
            this.gl.bindBuffer(usage, buffer);
            this.gl.bufferData(usage, arr, this.gl.DYNAMIC_DRAW);
        }
        return buffer;
    }
    createShader(code, type) {
        const shader = this.gl.createShader(type);
        if (!shader) {
            this.error(`shader (code: ${code})`, Types.RendererErrorType.creation);
        }
        this.gl.shaderSource(shader, code);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderInfoLog(shader)) {
            this.error(`shader (code: ${code})`, Types.RendererErrorType.initialization);
        }
        return shader;
    }
    createProgram(opt) {
        const program = this.gl.createProgram();
        if (!program) {
            this.error('program', Types.RendererErrorType.creation);
        }
        const vShader = this.createShader(opt.vShader, this.gl.VERTEX_SHADER);
        const fShader = this.createShader(opt.fShader, this.gl.FRAGMENT_SHADER);
        this.gl.attachShader(program, vShader);
        this.gl.attachShader(program, fShader);
        if (!this.gl.getProgramInfoLog(program)) {
            this.error('program', Types.RendererErrorType.creation);
        }
        return program;
    }
}

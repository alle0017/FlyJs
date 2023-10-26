import { Axis, } from "./generics.js";
import { Matrix } from "./matrices.js";
import { ProgramAttributes } from "./programAttributes.js";
import { GLRendererDelegate } from "./glRenderer.js";
class GLRenderer {
    set zNear(zNear) {
        if (this._near === zNear)
            return;
        this._near = zNear;
        this.updateProspectiveMatrix();
    }
    get zNear() {
        return this._near;
    }
    set zFar(zFar) {
        if (this._far === zFar)
            return;
        this._far = zFar;
        this.updateProspectiveMatrix();
    }
    get zFar() {
        return this._far;
    }
    set fieldOfView(angle) {
        if (this._fieldOfView === angle)
            return;
        this._fieldOfView = angle;
        this.updateProspectiveMatrix();
    }
    get fieldOfView() {
        return this._fieldOfView;
    }
    constructor(ctx) {
        this._near = 0.1;
        this._far = 50;
        this._fieldOfView = 60;
        this.prospectiveMatrix = new Float32Array(16);
        if (!ctx)
            throw new Error("WebGL not available");
        this.renderer = new GLRendererDelegate(ctx);
        this._resolution = ctx.canvas.width / ctx.canvas.height;
        this.updateProspectiveMatrix();
    }
    updateProspectiveMatrix() {
        this.prospectiveMatrix = new Float32Array(Matrix.prospective(this._fieldOfView, this._resolution, this._near, this._far));
    }
    /**
     *
     * @param {TypedArray} data the data to fill the buffer with
     * @param type the type of the buffer (e.g. gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER)
     * @param numberOfComponents number between 1 and 4 that indicates number of components (default is 3)
     * @param staticDraw optional. if is true, the buffer is set to static usage, otherwise to dynamic (default to false)
     * @returns Buffer or null if the creation failed. initially, the location attribute is set to 0
     */
    createBuffer(data, type, attributeName = '', numberOfComponents = 3, staticDraw = false) {
        const buffer = this.renderer.createBuffer(data, type, staticDraw);
        if (!buffer) {
            return null;
        }
        if (numberOfComponents <= 0 || numberOfComponents > 4) {
            console.warn('number of components must be greater than 0 and less than 4. automatically set to 3');
            numberOfComponents = 3;
        }
        return {
            buffer: buffer,
            location: 0,
            data: data,
            numberOfComponents: Math.floor(numberOfComponents),
            attributeName: attributeName
        };
    }
    resizeCanvas(width, height) {
        this.renderer.resizeCanvas(width, height);
        this._resolution = width / height;
    }
    selectTranslationMatrix(opt) {
        if (opt.translationMatrix) {
            return opt.translationMatrix;
        }
        else if (opt.translation) {
            return Matrix.translate(opt.translation);
        }
        return null;
    }
    selectRotationMatrix(opt) {
        if (opt === null || opt === void 0 ? void 0 : opt.rotationMatrix) {
            return opt.rotationMatrix;
        }
        else if (opt.angle || opt.axis) {
            return Matrix.rotation((opt && opt.angle) || 0.0, (opt && opt.axis) || Axis.X, (opt && opt.toRad) || false);
        }
        return null;
    }
    selectScaleMatrix(opt) {
        if (opt.scaleMatrix) {
            return opt.scaleMatrix;
        }
        else if (opt.scale) {
            return Matrix.scale(opt.scale);
        }
        return null;
    }
    setTransformationMatrix(opt) {
        let transformationMatrix = Matrix.IDENTITY_4X4;
        if (!opt)
            return transformationMatrix;
        if (opt.transformationMatrix)
            return opt.transformationMatrix;
        const translation = this.selectTranslationMatrix(opt);
        if (translation)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, translation);
        const rotation = this.selectRotationMatrix(opt);
        if (rotation)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, rotation);
        const scale = this.selectScaleMatrix(opt);
        if (scale)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, scale);
        if (opt.camera)
            transformationMatrix = Matrix.composeMatrix(opt.camera.matrix, 4, transformationMatrix);
        return transformationMatrix;
    }
    getBuffersFromProgramAttributes(codeAttr) {
        const buffers = [];
        for (let el of codeAttr.attributes) {
            const tmp = this.createBuffer(new Float32Array(el.value), this.renderer.ARRAY_BUFFER, el.name, el.dim);
            if (!tmp)
                return null;
            buffers.push(tmp);
        }
        return buffers;
    }
    getDrawFunction(opt) {
        const fillIndex = () => {
            opt.indices = [];
            for (let i = 0; i < opt.vertices.length / 3; i++)
                opt.indices.push(i);
        };
        const codeAttr = new ProgramAttributes(this, opt);
        const program = this.renderer.createProgram(codeAttr.vertex, codeAttr.fragment);
        if (!program)
            return null;
        const buffers = this.getBuffersFromProgramAttributes(codeAttr);
        if (!buffers)
            return null;
        this.renderer.getAttribLocations(buffers, program);
        this.renderer.getUniformLocation(codeAttr.uniforms, program);
        if (!opt.indices)
            fillIndex();
        const indicesBuffer = this.createBuffer(new Uint16Array(opt.indices), this.renderer.ELEMENT_ARRAY_BUFFER);
        if (!indicesBuffer)
            return null;
        return (opt) => {
            this.renderer.useProgram(program);
            this.renderer.bindBuffers(buffers);
            this.renderer.bindIndicesBuffer(indicesBuffer.buffer);
            codeAttr.uniforms[codeAttr.transform].value = this.setTransformationMatrix(opt);
            codeAttr.uniforms[codeAttr.prospective].value = this.prospectiveMatrix;
            if (codeAttr.animation >= 0) {
                codeAttr.uniforms[codeAttr.animation].value = (opt === null || opt === void 0 ? void 0 : opt.animationVector) || [0, 0];
            }
            this.renderer.bindUniforms(codeAttr.uniforms);
            this.renderer.draw(indicesBuffer.data.length);
        };
    }
}
GLRenderer.axis = Axis;
export { GLRenderer };

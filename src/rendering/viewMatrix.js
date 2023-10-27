import { Axis } from "./generics.js";
import { Matrix } from './matrices.js';
export class ViewDelegate {
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
    constructor(_resolution) {
        this._resolution = _resolution;
        // Camera properties
        this._near = 0.1; // Near clipping plane distance.
        this._far = 50; // Far clipping plane distance.
        this._fieldOfView = 60; // Field of view angle in degrees.
        this.prospectiveMatrix = [];
        // Update the perspective matrix based on initial camera properties
        this.updateProspectiveMatrix();
    }
    updateProspectiveMatrix() {
        // Calculate and assign a new perspective matrix based on camera properties
        this.prospectiveMatrix = Matrix.prospective(this._fieldOfView, this._resolution, this._near, this._far);
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
    /**
    * Selects the scale matrix from DrawOpt or creates one based on the scale vector.
    * @param {DrawOpt} opt - The drawing options.
    * @returns {Float32Array | null} The scale matrix or null if not provided.
    */
    selectScaleMatrix(opt) {
        if (opt.scaleMatrix) {
            return opt.scaleMatrix;
        }
        else if (opt.scale) {
            return Matrix.scale(opt.scale);
        }
        return null;
    }
    /**
    * Combines translation, rotation, and scale matrices to create the final transformation matrix.
    * @param {DrawOpt} opt - The drawing options.
    * @returns {Float32Array} The transformation matrix.
    */
    getTransformationMatrix(opt) {
        let transformationMatrix = Matrix.IDENTITY_4X4;
        // If no drawing options provided, return the identity matrix
        if (!opt)
            return transformationMatrix;
        // If a specific transformation matrix is provided, return it
        if (opt.transformationMatrix)
            return opt.transformationMatrix;
        // Select and compose translation, rotation, and scale matrices
        const translation = this.selectTranslationMatrix(opt);
        if (translation)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, translation);
        const rotation = this.selectRotationMatrix(opt);
        if (rotation)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, rotation);
        const scale = this.selectScaleMatrix(opt);
        if (scale)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, scale);
        // If a camera is provided, combine with the transformation matrix
        if (opt.camera)
            transformationMatrix = Matrix.composeMatrix(opt.camera.matrix, 4, transformationMatrix);
        return transformationMatrix;
    }
}

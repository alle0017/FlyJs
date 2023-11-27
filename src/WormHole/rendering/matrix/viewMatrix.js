import { Axis } from "../types.js";
import { Matrix } from './matrices.js';
export class ViewDelegate {
    set zNear(zNear) {
        if (this._near === zNear)
            return;
        this._near = zNear;
        this.updatePerspectiveMatrix();
    }
    get zNear() {
        return this._near;
    }
    set zFar(zFar) {
        if (this._far === zFar)
            return;
        this._far = zFar;
        this.updatePerspectiveMatrix();
    }
    get zFar() {
        return this._far;
    }
    set fieldOfView(angle) {
        if (this._fieldOfView === angle)
            return;
        this._fieldOfView = angle;
        this.updatePerspectiveMatrix();
    }
    get fieldOfView() {
        return this._fieldOfView;
    }
    constructor(_resolution) {
        this._resolution = _resolution;
        this._near = 0.1;
        this._far = 50;
        this._fieldOfView = 60;
        this.perspectiveMatrix = [];
        // Update the perspective matrix based on initial camera properties
        this.updatePerspectiveMatrix();
    }
    updatePerspectiveMatrix() {
        // Calculate and assign a new perspective matrix based on camera properties
        this.perspectiveMatrix = Matrix.perspective(this._fieldOfView, this._resolution, this._near, this._far);
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
    getTransformationMatrix(opt) {
        let transformationMatrix = Matrix.IDENTITY_4X4;
        // If no drawing options provided, return the identity matrix
        if (!opt)
            return transformationMatrix;
        // If a specific transformation matrix is provided, return it
        if (opt.transformationMatrix)
            return opt.transformationMatrix;
        // Select and compose translation, rotation, and scale matrices
        const scale = this.selectScaleMatrix(opt);
        if (scale)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, scale);
        const translation = this.selectTranslationMatrix(opt);
        if (translation)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, translation);
        const rotation = this.selectRotationMatrix(opt);
        if (rotation)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, rotation);
        // If a camera is provided, combine with the transformation matrix
        if (opt.camera)
            transformationMatrix = Matrix.composeMatrix(opt.camera.matrix, 4, transformationMatrix);
        return transformationMatrix;
    }
    calculateSkeletonPosition(bones, angles, translations) {
        const outMatrices = [];
        bones.bones.forEach((bone, i) => {
            const localMatrix = Matrix.composeMatrix(Matrix.rotation(angles[i], Axis.Z), 4, Matrix.translate(translations[i]));
            if (i === bones.root)
                bone.transformationMatrix = localMatrix;
            else
                bone.transformationMatrix = Matrix.composeMatrix(bones.bones[bones.indices[i]].transformationMatrix, 4, localMatrix);
            outMatrices.push(bone.transformationMatrix);
        });
        return outMatrices;
    }
}

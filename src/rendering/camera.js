import { Axis } from "./generics.js";
import { Matrix } from "./matrices.js";
export class Camera {
    set angle(deg) {
        if (this._cameraAngle === deg)
            return;
        this._cameraAngle = deg;
        this.updateCameraMatrix();
    }
    get angle() {
        return this._cameraAngle;
    }
    set position(point) {
        if (this._cameraPosition.x === point.x &&
            this._cameraPosition.y === point.y &&
            this._cameraPosition.z === point.z)
            return;
        this._cameraPosition = point;
        this.updateCameraMatrix();
    }
    get position() {
        return this._cameraPosition;
    }
    set x(x) {
        if (x === this._cameraPosition.x)
            return;
        this._cameraPosition.x = x;
        this.updateCameraMatrix();
    }
    get x() {
        return this._cameraPosition.x;
    }
    set y(y) {
        if (y === this._cameraPosition.y)
            return;
        this._cameraPosition.y = y;
        this.updateCameraMatrix();
    }
    get y() {
        return this._cameraPosition.y;
    }
    set z(z) {
        if (z === this._cameraPosition.z)
            return;
        this._cameraPosition.z = z;
        this.updateCameraMatrix();
    }
    get z() {
        return this._cameraPosition.z;
    }
    constructor() {
        this.matrix = [];
        this.rotationAxis = Axis.X;
        this._cameraAngle = 0;
        this._cameraPosition = { x: 0, y: 0, z: 0 };
        this.updateCameraMatrix();
    }
    updateCameraMatrix() {
        const camera = Matrix.composeMatrix(Matrix.rotation(this._cameraAngle, this.rotationAxis), 4, Matrix.translate(this._cameraPosition));
        this.matrix = Matrix.invert(camera, 4);
    }
}

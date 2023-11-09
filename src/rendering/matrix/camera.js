import { Axis } from "../generics.js";
import { Matrix } from "./matrices.js";
/**
 * Represents a camera in a 3D scene.
 */
export class Camera {
    /**
     * Set the rotation angle of the camera.
     * @param {number} deg - The new rotation angle in degrees.
     */
    set angle(deg) {
        if (this._cameraAngle === deg)
            return;
        this._cameraAngle = deg;
        this.updateCameraMatrix();
    }
    /**
     * Get the rotation angle of the camera.
     * @returns {number} - The rotation angle in degrees.
     */
    get angle() {
        return this._cameraAngle;
    }
    /**
     * Set the position of the camera in 3D space.
     * @param {Point} point - The new position of the camera.
     */
    set position(point) {
        if (this._cameraPosition.x === point.x &&
            this._cameraPosition.y === point.y &&
            this._cameraPosition.z === point.z)
            return;
        this._cameraPosition = point;
        this.updateCameraMatrix();
    }
    /**
     * Get the position of the camera in 3D space.
     * @returns {Point} - The position of the camera.
     */
    get position() {
        return this._cameraPosition;
    }
    /**
     * Set the x-coordinate of the camera's position.
     * @param {number} x - The new x-coordinate.
     */
    set x(x) {
        if (x === this._cameraPosition.x)
            return;
        this._cameraPosition.x = x;
        this.updateCameraMatrix();
    }
    /**
     * Get the x-coordinate of the camera's position.
     * @returns {number} - The x-coordinate.
     */
    get x() {
        return this._cameraPosition.x;
    }
    /**
     * Set the y-coordinate of the camera's position.
     * @param {number} y - The new y-coordinate.
     */
    set y(y) {
        if (y === this._cameraPosition.y)
            return;
        this._cameraPosition.y = y;
        this.updateCameraMatrix();
    }
    /**
     * Get the y-coordinate of the camera's position.
     * @returns {number} - The y-coordinate.
     */
    get y() {
        return this._cameraPosition.y;
    }
    /**
     * Set the z-coordinate of the camera's position.
     * @param {number} z - The new z-coordinate.
     */
    set z(z) {
        if (z === this._cameraPosition.z)
            return;
        this._cameraPosition.z = z;
        this.updateCameraMatrix();
    }
    /**
     * Get the z-coordinate of the camera's position.
     * @returns {number} - The z-coordinate.
     */
    get z() {
        return this._cameraPosition.z;
    }
    /**
     * Constructor for the Camera class.
     */
    constructor() {
        /**
         * Transformation matrix representing the camera's view.
         */
        this.matrix = [];
        /**
         * Axis of rotation for the camera.
         */
        this.rotationAxis = Axis.X;
        /**
         * Camera's rotation angle in degrees.
         */
        this._cameraAngle = 0;
        /**
         * Camera's position in 3D space.
         */
        this._cameraPosition = { x: 0, y: 0, z: 0 };
        this.updateCameraMatrix();
    }
    /**
     * Updates the camera's transformation matrix based on its position and rotation.
     */
    updateCameraMatrix() {
        const camera = Matrix.composeMatrix(Matrix.rotation(this._cameraAngle, this.rotationAxis), 4, Matrix.translate(this._cameraPosition));
        this.matrix = Matrix.invert(camera, 4);
    }
}

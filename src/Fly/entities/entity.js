import { Matrix } from '../rendering/matrix/matrices.js';
import { game } from '../fly.js';
class Entity {
    get x() {
        return this._x;
    }
    set x(x) {
        var _a;
        if (this._x === x)
            return;
        this._x = x;
        if (this.camera) {
            this.camera.x = x;
            this.setCameraToAll();
        }
        const matrix = Matrix.translate({ x: this._x, y: this._y, z: this._z });
        if (this.appended) {
            (_a = this.game) === null || _a === void 0 ? void 0 : _a.renderer.setAttributes(this._id, { translationMatrix: matrix });
        }
        else {
            this._renderable.attributes.translationMatrix = matrix;
        }
    }
    get y() {
        return this._y;
    }
    set y(y) {
        var _a;
        if (this._y === y)
            return;
        this._y = y;
        if (this.camera) {
            this.camera.y = y;
            this.setCameraToAll();
        }
        const matrix = Matrix.translate({ x: this._x, y: this._y, z: this._z });
        if (this.appended) {
            (_a = this.game) === null || _a === void 0 ? void 0 : _a.renderer.setAttributes(this._id, { translationMatrix: matrix });
        }
        else {
            this._renderable.attributes.translationMatrix = matrix;
        }
    }
    get z() {
        return this._z;
    }
    set z(z) {
        var _a;
        if (this._z === z)
            return;
        this._z = z;
        if (this.camera) {
            this.camera.z = z;
            this.setCameraToAll();
        }
        const matrix = Matrix.translate({ x: this._x, y: this._y, z: this._z });
        if (this.appended) {
            (_a = this.game) === null || _a === void 0 ? void 0 : _a.renderer.setAttributes(this._id, { translationMatrix: matrix });
        }
        else {
            this._renderable.attributes.translationMatrix = matrix;
        }
    }
    get position() {
        return { x: this._x, y: this._y, z: this._z };
    }
    set position(position) { }
    get id() {
        return this._id;
    }
    set id(id) {
        console.warn('cannot set id');
    }
    get renderable() {
        return this._renderable;
    }
    set renderable(renderable) { }
    constructor() {
        this._x = 0;
        this._y = 0;
        this._z = 0;
        this.appended = false;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.ax = 0;
        this.ay = 0;
        this.az = 0;
        this._id = Entity.COMMON_ID + Entity.UNIQUE_ID;
        Entity.UNIQUE_ID++;
        this.game = game;
    }
    setCameraToAll() {
        if (!this.appended)
            return;
        this.game.renderer.setToAll({ camera: this.camera });
    }
}
Entity.UNIQUE_ID = 0;
Entity.COMMON_ID = 'ENTITY_';
export { Entity };
export function isEntity(obj) {
    return 'id' in obj &&
        'appended' in obj &&
        'renderable' in obj &&
        'onEnter' in obj &&
        'onDismiss' in obj &&
        'onDraw' in obj;
}

import { GameController } from "../controller/gameController.js";
import { Matrix } from '../rendering/matrix/matrices.js';
class Entity {
    get x() {
        return this._x;
    }
    set x(x) {
        var _a;
        if (this._x === x)
            return;
        this._x = x;
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
        const matrix = Matrix.translate({ x: this._x, y: this._y, z: this._z });
        if (this.appended) {
            (_a = this.game) === null || _a === void 0 ? void 0 : _a.renderer.setAttributes(this._id, { translationMatrix: matrix });
        }
        else {
            this._renderable.attributes.translationMatrix = matrix;
        }
    }
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
        GameController.get().then(value => this.game = value);
        this._id = Entity.COMMON_ID + Entity.UNIQUE_ID;
        Entity.UNIQUE_ID++;
    }
}
Entity.UNIQUE_ID = 0;
Entity.COMMON_ID = 'ENTITY_';
export { Entity };

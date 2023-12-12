import { Axis, } from '../rendering/types.js';
import { EventEmitter } from './eventController.js';
import { isEntity, Entity } from '../entities/entity.js';
import { Camera } from '../rendering/matrix/camera.js';
class Scene {
    get useCamera() {
        return this._useCamera;
    }
    set useCamera(value) {
        if (this._useCamera === value)
            return;
        this._useCamera = value;
        if (!this._useCamera) {
            this._camera = undefined;
            this.$game.renderer.setToAll({ camera: undefined });
        }
        else {
            this._camera = new Camera();
            this.$game.renderer.setToAll({ camera: this._camera });
        }
    }
    get cameraPosition() {
        var _a;
        return ((_a = this._camera) === null || _a === void 0 ? void 0 : _a.position) || { x: 0, y: 0, z: 0 };
    }
    set cameraPosition(position) {
        if (!this._camera) {
            console.warn('no camera available');
            return;
        }
        this._camera.position = position;
        this.setCameraToAll();
    }
    constructor(game) {
        this.objects = new Map();
        this.functions = [];
        this.appended = false;
        this._useCamera = false;
        this.id = Scene.SCENE_ID;
        Scene.SCENE_ID++;
        this.$game = game;
    }
    appendRenderable(key, object) {
        this.$game.renderer.append(key, object);
    }
    appendEntity(object) {
        object.onEnter();
        this.$game.renderer.append(object.id, object.renderable);
        object.appended = true;
    }
    setCameraToAll() {
        if (this.appended) {
            this.$game.renderer.setToAll({ camera: this._camera });
        }
        else {
            this.objects.forEach(obj => {
                if (obj instanceof Entity) {
                    obj.renderable.attributes.camera = this._camera;
                }
                else {
                    obj.attributes.camera = this._camera;
                }
            });
        }
    }
    use() {
        this.appended = true;
        EventEmitter.fire(`scene_${this.id}_enter`, { game: this.$game });
        this.objects.forEach((object, key) => {
            if (isEntity(object)) {
                this.appendEntity(object);
            }
            else {
                this.appendRenderable(key, object);
            }
        });
        this.functions.forEach(fn => this.$game.loopController.add(fn));
    }
    dismiss() {
        this.appended = false;
        EventEmitter.fire(`scene_${this.id}_dismiss`, { game: this.$game });
        this.objects.forEach(object => {
            if (isEntity(object)) {
                object.appended = false;
                object.onDismiss();
            }
        });
    }
    attach(arg0, arg1, arg2) {
        if (typeof arg0 !== 'string') {
            this.objects.set(arg0.id, arg0);
            if (arg1)
                arg0.renderable.attributes = arg1;
            arg0.renderable.attributes = Object.assign(Object.assign({}, arg0.renderable.attributes), { camera: this._camera });
            this.execute((arg0.onDraw).bind(arg0));
        }
        else {
            this.objects.set(arg0, arg1);
            if (arg2)
                arg1.attributes = arg2;
            arg1.attributes = Object.assign(Object.assign({}, arg1.attributes), { camera: this._camera });
        }
        if (!this.appended)
            return;
        if (typeof arg0 !== 'string') {
            this.appendEntity(arg0);
        }
        else {
            this.appendRenderable(arg0, arg1);
        }
    }
    execute(fn) {
        this.functions.push(fn);
    }
    onEnter(func) {
        EventEmitter.on(`scene_${this.id}_enter`, func);
    }
    onDismiss(func) {
        EventEmitter.on(`scene_${this.id}_dismiss`, func);
    }
    setCameraAngle(angle, axis = Axis.X) {
        if (!this._camera) {
            console.warn('no camera available');
            return;
        }
        this._camera.rotationAxis = axis;
        this._camera.angle = angle;
        this.setCameraToAll();
    }
    attachCameraToEntity(entity) {
        if (!this._camera) {
            this._camera = new Camera();
            this.setCameraToAll();
        }
        entity.camera = this._camera;
    }
    detachCameraFromEntity(entity) {
        if (!this._camera)
            return;
        entity.camera = undefined;
        this._camera = undefined;
        this.setCameraToAll();
    }
    useGlobalCamera() {
        if (this._camera)
            return;
        this._camera = new Camera();
        this.setCameraToAll();
    }
    detachGlobalCamera() {
        if (!this._camera)
            return;
        this._camera = undefined;
        this.setCameraToAll();
    }
}
Scene.SCENE_ID = 0;
export { Scene };

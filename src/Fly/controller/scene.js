import { EventEmitter } from './eventController.js';
import { isEntity } from '../entities/entity.js';
class Scene {
    constructor(game) {
        this.objects = new Map();
        this.functions = [];
        this.appended = false;
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
            this.execute((arg0.onDraw).bind(arg0));
        }
        else {
            this.objects.set(arg0, arg1);
            if (arg2)
                arg1.attributes = arg2;
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
}
Scene.SCENE_ID = 0;
export { Scene };

import { EventEmitter } from './eventController.js';
import { Entity } from '../entities/entity.js';
class Scene {
    constructor() {
        this.objects = new Map();
        this.functions = [];
        this.id = Scene.SCENE_ID;
        Scene.SCENE_ID++;
    }
    use(game) {
        EventEmitter.fire(`scene_${this.id}_enter`, { game });
        this.objects.forEach((object, key) => {
            if (object instanceof Entity) {
                game.renderer.append(key, object.renderable);
                object.appended = true;
            }
            else {
                game.renderer.append(key, object);
            }
        });
        this.functions.forEach(fn => game.loopController.add(fn));
    }
    dismiss(game) {
        EventEmitter.fire(`scene_${this.id}_dismiss`, { game });
        this.objects.forEach(object => {
            if (object instanceof Entity)
                object.appended = false;
        });
    }
    attach(arg0, arg1, arg2) {
        if (arg0 instanceof Entity) {
            this.objects.set(arg0.id, arg0.renderable);
            if (arg1)
                arg0.renderable.attributes = arg1;
        }
        else {
            this.objects.set(arg0, arg1);
            if (arg2)
                arg1.attributes = arg2;
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

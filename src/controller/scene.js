import { EventEmitter } from './eventController.js';
class Scene {
    constructor() {
        this.objects = new Map();
        this.functions = [];
        this.id = Scene.SCENE_ID;
        Scene.SCENE_ID++;
    }
    use(game) {
        EventEmitter.fire(`scene_${this.id}_enter`, { game });
        return {
            functions: [...this.functions],
            objects: this.objects
        };
    }
    dismiss(game) {
        EventEmitter.fire(`scene_${this.id}_dismiss`, {});
    }
    attach(name, object, attributes) {
        this.objects.set(name, object);
        if (attributes)
            object.attributes = attributes;
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

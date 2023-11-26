import { GameController } from "./gameController.js";
import { EventEmitter } from "./eventController.js";
import { Scene } from "./scene.js";
import { Entity } from "../entities/entity.js";
export const game = await GameController.get();
export class CustomScene extends Scene {
    constructor() {
        super();
        this.$game = game;
        this.$renderer = game.renderer;
        this.$assets = game.assets;
        this.$debug = game.debug;
        this.$events = EventEmitter;
    }
    use(game) {
        this.onCreate(game);
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
        game.loopController.add((this.update).bind(this));
    }
    dismiss(game) {
        super.dismiss(game);
        this.onDestroyed(game);
    }
}

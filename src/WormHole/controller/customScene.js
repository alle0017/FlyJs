import { EventEmitter } from "./eventController.js";
import { Scene } from "./scene.js";
export class CustomScene extends Scene {
    constructor(game) {
        super(game);
        this.$renderer = game.renderer;
        this.$assets = game.assets;
        this.$debug = game.debug;
        this.$events = EventEmitter;
    }
    use() {
        this.onCreate(this.$game);
        super.use();
        this.$game.loopController.add((this.update).bind(this));
    }
    dismiss() {
        super.dismiss();
        this.onDestroyed(this.$game);
    }
}

import { WebGLRenderer } from '../rendering/GLRenderer.js';
import { WebGPURenderer } from '../rendering/GPURenderer.js';
import { Debug } from './debug.js';
import { LoopController, } from './loopController.js';
import { Scene } from './scene.js';
import { EventEmitter } from './eventController.js';
export class GameController {
    get scene() {
        return this._scene;
    }
    set scene(scene) {
        console.warn('the scene can be set only with useScene method');
    }
    get scenes() {
        return this.assets.scenes;
    }
    set scenes(scene) { }
    get images() {
        return this.assets.images;
    }
    set images(images) { }
    get renderable() {
        return this.assets.renderable;
    }
    set renderable(renderable) { }
    constructor() {
        this.events = EventEmitter;
        this.assets = {
            images: {},
            renderable: {},
            scenes: {},
        };
        this.refs = {};
        this.cvs = document.createElement('canvas');
        if (!this.cvs)
            throw 'canvas cannot be created';
        this.cvs.width = 800;
        this.cvs.height = 600;
        document.body.appendChild(this.cvs);
        if ('gpu' in navigator) {
            this.renderer = new WebGPURenderer(this.cvs);
            console.log('%cgpu enabled', 'color: #ff9933');
        }
        else {
            this.renderer = new WebGLRenderer(this.cvs);
            console.log('%cgl enabled', 'color: #9999ff');
        }
        this.debug = new Debug(this);
        this.loopController = new LoopController();
        this.loopController.execute();
        this.setEvents();
    }
    static async get() {
        if (!GameController.game) {
            GameController.game = new GameController();
            await GameController.game.renderer.init();
        }
        return GameController.game;
    }
    setEvents() {
        window.addEventListener('keydown', (e) => this.events.fire(e.key, { game: this }));
        window.addEventListener('keypress', (e) => this.events.fire(e.key, { game: this }));
        window.addEventListener('keyup', (e) => this.events.fire(this.events.KEY_UP, { game: this }));
    }
    useScene(arg0) {
        if (this._scene) {
            this._scene.dismiss();
        }
        this.renderer.removeAll();
        this.loopController.removeAll();
        if (arg0 instanceof Scene) {
            arg0.use();
            this._scene = arg0;
        }
        else {
            const scene = new arg0(this);
            scene.use();
            this._scene = scene;
        }
    }
    createScene() {
        return new Scene(this);
    }
}

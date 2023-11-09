import { Load } from '../controller/loadData.js';
import { Entity } from "./entity.js";
import { Axis } from '../rendering/generics.js';
import { Camera } from '../rendering/matrix/camera.js';
import { Matrix } from '../rendering/matrix/matrices.js';
/**
* Represents a 2D sprite in a game.
*/
class Sprite2D extends Entity {
    /**
    * Sets the vertices of the sprite.
    * @param {number[]} vertices - The vertices of the sprite.
    */
    set vertices(vertices) { }
    get vertices() {
        return [
            -1.0, -1.0, -5,
            1.0, -1.0, -5,
            1.0, 1.0, -5,
            -1.0, 1.0, -5,
        ];
    }
    /**
    * Sets the current costume of the sprite.
    * @param {number} n - The index of the costume to set.
    */
    set costume(n) {
        if (n <= this._costumes && n >= 0 && n !== this.currentCostume) {
            this.currentCostume = n;
            this.setAnimationVector();
        }
    }
    get costume() {
        return this.currentCostume;
    }
    /**
    * Sets the current frame of the sprite.
    * @param {number} n - The index of the frame to set.
    */
    set frame(n) {
        if (n <= this._frames && n >= 0 && n !== this.currentFrame) {
            this.currentFrame = n;
            this.setAnimationVector();
        }
    }
    get frame() {
        return this.currentFrame;
    }
    /**
    * Constructor for the Sprite2D class.
    * @param {Game} game - The game instance.
    * @param {Sprite2DOpt} opt - Options for creating the sprite.
    */
    constructor(game, opt) {
        super();
        this.game = game;
        this.TEXTURE_COORDINATES_LENGTH = 1;
        this._axis = Axis.Z;
        this.vertexNumber = 4;
        this.currentFrame = 0;
        this.currentCostume = 0;
        this._costumes = 1;
        this._frames = 1;
        this.deltaFrame = this.TEXTURE_COORDINATES_LENGTH;
        this.deltaCostume = this.TEXTURE_COORDINATES_LENGTH;
        this.animationVector = [0, 0];
        this.deltaTime = 0;
        this.camera = new Camera();
        this.animationDelay = 100;
        // Check if animation is needed and set attributes accordingly
        let animate = this.setAttributesFromOptions(opt);
        // Load the image asynchronously
        if (typeof opt.img !== 'string') {
            this.img = opt.img;
        }
        else {
            Load.image(opt.img).then((img) => {
                this.img = img;
                this.setDrawFunction(animate);
            });
        }
    }
    /**
    * Creates a model for the sprite.
    * @param {Game} game - The game instance.
    * @param {Sprite2DOpt} opt - Options for creating the sprite.
    * @returns {Promise<()=> Sprite2D>} - A function that creates a new Sprite2D instance.
    */
    static async createModel(game, opt) {
        if (typeof opt.img === 'string') {
            opt.img = await Load.image(opt.img);
        }
        return () => new Sprite2D(game, opt);
    }
    /**
    * Sets attributes of the sprite based on options.
    * @param {Sprite2DOpt} opt - Options for creating the sprite.
    * @returns {boolean} - Indicates if animation is enabled.
    */
    setAttributesFromOptions(opt) {
        let animate = false;
        if (opt.frames) {
            this._frames = opt.frames;
            this.deltaFrame = this.TEXTURE_COORDINATES_LENGTH / opt.frames;
            animate = true;
        }
        if (opt.costumes) {
            this._costumes = opt.costumes;
            this.deltaCostume = this.TEXTURE_COORDINATES_LENGTH / opt.costumes;
            animate = true;
        }
        if (opt.position) {
            this.position = opt.position;
        }
        if (opt.angle) {
            this.angle = opt.angle;
        }
        if (opt.scale) {
            this._scale = opt.scale;
        }
        if (opt.camera) {
            this.camera = opt.camera;
        }
        return animate;
    }
    /**
    * Sets the draw function for the sprite.
    * @param {boolean} animate - Indicates if animation is enabled.
    */
    setDrawFunction(animate) {
        const draw = this.game.renderer.getDrawFunction({
            vertices: this.vertices,
            image: this.img,
            textureCoords: [
                this.deltaFrame, this.deltaCostume,
                0, this.deltaCostume,
                0, 0,
                this.deltaFrame, 0,
            ],
            indices: Sprite2D.SQUARE_INDICES,
            animate: animate,
        });
        if (!draw)
            throw 'something went wrong with draw function';
        this.draw = () => {
            var _a;
            draw({
                transformationMatrix: Matrix.composeMatrix(this._transformationMatrix, 4, (_a = this.camera) === null || _a === void 0 ? void 0 : _a.matrix),
                animationVector: this.animationVector,
            });
        };
    }
    /**
    * Sets the animation vector based on the current frame and costume.
    */
    setAnimationVector() {
        const x = this.currentFrame * this.deltaFrame;
        const y = this.currentCostume * this.deltaCostume;
        this.animationVector = [x, y];
    }
    /**
    * Animates the sprite by changing frames based on the animation delay.
    */
    animate() {
        if (this.game.time - this.deltaTime <= this.animationDelay)
            return;
        this.deltaTime = this.game.time;
        this.frame++;
        if (this.frame === this._frames)
            this.frame = 0;
        this.draw();
    }
    draw() { }
}
Sprite2D.SQUARE_INDICES = [0, 1, 2, 0, 2, 3];
export { Sprite2D };

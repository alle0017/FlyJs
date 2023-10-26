import { Load } from '../controller/loadData.js';
import { Entity } from "./entity.js";
import { Game } from '../controller/game.js';
import { DrawFunction, Axis, Point } from '../rendering/generics.js';
import { Camera } from '../rendering/camera.js';
import { Matrix } from '../rendering/matrices.js';

type Sprite2DOpt = {
      img: string | HTMLImageElement;
      camera?: Camera;
      scale?: number;
      position?: Point;
      angle?: number;
      costumes?: number;
      frames?: number;
}
  
/**
* Represents a 2D sprite in a game.
*/
export class Sprite2D extends Entity {
      private static readonly SQUARE_INDICES = [0, 1, 2, 0, 2, 3];

      private readonly TEXTURE_COORDINATES_LENGTH = 1;

      protected override readonly _axis = Axis.Z;
      private readonly vertexNumber: number = 4;

      private currentFrame: number = 0;
      private currentCostume: number = 0;
      private _costumes: number = 1;
      private _frames: number = 1;
      private deltaFrame: number = this.TEXTURE_COORDINATES_LENGTH;
      private deltaCostume: number = this.TEXTURE_COORDINATES_LENGTH;
      private animationVector: [number, number] = [0, 0];
      private deltaTime = 0;

      camera: Camera = new Camera();
      img: HTMLImageElement | undefined;
      animationDelay: number = 100;
      
      /**
      * Sets the vertices of the sprite.
      * @param {number[]} vertices - The vertices of the sprite.
      */
      private set vertices(vertices: number[]) { }
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
      set costume(n: number) {
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
      set frame(n: number) {
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
      constructor(private game: Game, opt: Sprite2DOpt) {
            super();
      
            // Check if animation is needed and set attributes accordingly
            let animate = this.setAttributesFromOptions(opt);
      
            // Load the image asynchronously
            if (typeof opt.img !== 'string') {
                  this.img = opt.img;
            } else {
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
      static async createModel(game: Game, opt: Sprite2DOpt): Promise<()=> Sprite2D> {
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
      private setAttributesFromOptions(opt: Sprite2DOpt): boolean {
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
      private setDrawFunction(animate: boolean) {
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
            }) as DrawFunction;
            if (!draw)
                  throw 'something went wrong with draw function';
            this.draw = () => {
                  draw({
                        transformationMatrix: Matrix.composeMatrix(this._transformationMatrix, 4, this.camera?.matrix),
                        animationVector: this.animationVector,
                  });
            }
      }
      
      /**
      * Sets the animation vector based on the current frame and costume.
      */
      private setAnimationVector() {
            const x = this.currentFrame * this.deltaFrame;
            const y = this.currentCostume * this.deltaCostume;
            this.animationVector = [x, y];
            }
      
            /**
            * Animates the sprite by changing frames based on the animation delay.
            */
            animate() {
            if (this.game.time - this.deltaTime <= this.animationDelay) return;
            this.deltaTime = this.game.time;
            this.frame++;
            if (this.frame === this._frames)
                  this.frame = 0;
            this.draw();
      }
      
      draw() { }
}
  
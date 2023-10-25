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

export class Sprite2D extends Entity {
      private static readonly SQUARE_INDICES = [0,1,2, 0,2,3,];

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

      private set vertices(vertices: number[]){}
      get vertices(){
            return [
            -1.0, -1.0, -5, 
            1.0, -1.0, -5, 
            1.0, 1.0, -5, 
            -1.0, 1.0, -5,
           ]
      }

      set costume(n: number){
            if(n <= this._costumes && n >= 0 && n !== this.currentCostume){
                  this.currentCostume = n;
                  this.setAnimationVector();
            }
      }
      get costume(){
            return this.currentCostume;
      }

      set frame(n: number){
            if(n <= this._frames && n >= 0 && n !== this.currentFrame){
                  this.currentFrame = n;
                  this.setAnimationVector();
            }
      }
      get frame(){
            return this.currentFrame;
      }
      constructor(private game: Game, opt: Sprite2DOpt){

            super();
            
            let animate = this.setAttributesFromOptions(opt);

            if(typeof opt.img !== 'string'){
                  this.img = opt.img;
            }else{
                  Load.image(opt.img).then((img)=>{
                        this.img = img;
                        this.setDrawFunction(animate);
                  })
            }
      }

      static async createModel(game: Game, opt: Sprite2DOpt){
            if(typeof opt.img === 'string'){
                  opt.img = await Load.image(opt.img);
            }
            return () => new Sprite2D(game, opt);
      }

      private setAttributesFromOptions(opt: Sprite2DOpt): boolean {
            let animate = false;
            if(opt.frames){
                  this._frames = opt.frames;
                  this.deltaFrame = this.TEXTURE_COORDINATES_LENGTH/opt.frames;
                  animate = true;
            }
            if(opt.costumes){
                  this._costumes = opt.costumes;
                  this.deltaCostume = this.TEXTURE_COORDINATES_LENGTH/opt.costumes;
                  animate = true;
            }
            if(opt.position){
                  this.position = opt.position;
            }
            if(opt.angle){
                  this.angle = opt.angle;
            }
            if(opt.scale){
                  this._scale = opt.scale;
            }
            if(opt.camera){
                  this.camera = opt.camera;
            }
            return animate;
      }
      private setDrawFunction(animate: boolean){
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
            if(!draw)
                  throw 'something went wrong with draw function';
            this.draw = ()=>{
                  draw({ 
                        transformationMatrix: Matrix.composeMatrix(this._transformationMatrix, 4, this.camera?.matrix),
                        animationVector: this.animationVector,
                  });
            }
      }
      private setAnimationVector(){
            const x = this.currentFrame * this.deltaFrame;
            const y = this.currentCostume * this.deltaCostume ;
            this.animationVector = [x, y];
      }
      animate(){
            if(this.game.time - this.deltaTime <= this.animationDelay) return;
            this.deltaTime = this.game.time;
            this.frame++;
            if(this.frame === this._frames)
                  this.frame = 0;
            this.draw();
      }

      draw(){}
}
import { DrawableElementAttributes, Renderable } from "../rendering/types.js";
import { Entity } from "./entity.js";
import { Shapes } from "../rendering/shapes.js";
export type Sprite2DOpt = {
      image?: ImageBitmap;
      displacementMap?: ImageBitmap;
      bumpScale?: number;
      vertices?: number[];
      indices?: number[];
      colors?: number[];
      frames?: number;
      costumes?: number;
} 

export abstract class Sprite2D extends Entity {

      protected _renderable: Renderable;

      protected costumes: number = 1;
      protected frames: number = 1;

      private animationVector: [number, number] = [0, 0];
      
      get costume(){
            return this.animationVector[1]*this.costumes;
      }
      set costume( n: number ){
            if( n == this.animationVector[1] || n >= this.costumes || n < 0 ){
                  return;
            }
            this.animationVector[1] = n/this.costumes;
            if( this.appended ){
                  this.game?.renderer.setAttributes( this.id, { animationVector: this.animationVector } );
            }else{
                  this._renderable.attributes.animationVector = this.animationVector;
            }
      }

      get frame(){
            return this.animationVector[0]*this.frames;
      }
      set frame( n: number ){
            if(  n == this.animationVector[0] || n >= this.frames || n < 0 )
                  return
            this.animationVector[0] = n/this.frames;
            if( this.appended ){
                  this.game?.renderer.setAttributes( this.id, { animationVector: this.animationVector } );
            }else{
                  this._renderable.attributes.animationVector = this.animationVector;
            }
      }
      

      constructor( opt: Sprite2DOpt ){
            super();
            const descriptor: DrawableElementAttributes = this.getRenderableDescription( opt );
            this._renderable = this.game!.renderer.create( descriptor );
            this._renderable.attributes = { scale: { x: 1.5, y: 1, z: 1} };
            this.z = -1
      }
      private getRenderableDescription( opt: Sprite2DOpt ){
            const descriptor: DrawableElementAttributes = {
                  vertices: []
            };
            if( opt.frames )
                  this.frames = opt.frames;
            if( opt.costumes )
                  this.costumes = opt.costumes;
            if( opt.displacementMap )
                  descriptor.imageData!.displacementMap = opt.displacementMap;
            if( opt.image ){
                  descriptor.imageData = {
                        image: opt.image,
                        textureCoords: [
                              1/this.frames, 0,
                              0, 0,
                              0, 1/this.costumes,
                              1/this.frames, 1/this.costumes,
                        ],
                  };
                  const rect = Shapes.rectangle( 0.15, 0.2 )
                  descriptor.indices = rect.indices;
                  descriptor.vertices = rect.vertices;
                  if( this.costumes > 1 || this.frames > 1 )
                        descriptor.imageData.animate = true;
            }else if( opt.vertices ){
                  descriptor.vertices = opt.vertices;
                  if( opt.indices ){
                        descriptor.indices = opt.indices;
                  }
                  if( opt.colors ){
                        descriptor.color = opt.colors 
                  }else{
                        descriptor.staticColor = { r: 1, g: 0, b: 0, a: 1 };
                  }
            }
            descriptor.perspective = true;
            return descriptor;
      }
      
}
import { DrawableElementAttributes, Renderable } from "../rendering/types.js";
import { Entity } from "./entity.js";
import { Shapes } from "../rendering/shapes.js";
export type Sprite3DOpt = {
      image: ImageBitmap;
      displacementMap?: ImageBitmap;
      bumpScale?: number;
}

export abstract class Sprite3D extends Entity {
      protected _renderable: Renderable;
      constructor( opt: Sprite3DOpt ){
            super();
            const descriptor: DrawableElementAttributes = {
                  ...Shapes.rectangle(),
                  imageData: {
                        image: opt.image,
                        textureCoords: [
                              1, 1,
                              0, 1,
                              1, 0,
                              0, 0,
                        ],
                  },
                  
            };
            if( opt.displacementMap )
                  descriptor.imageData!.displacementMap = opt.displacementMap;;
            this._renderable = this.game!.renderer.create( descriptor );
      }
      draw(): void {
            throw new Error("Method not implemented.");
      }
      
}
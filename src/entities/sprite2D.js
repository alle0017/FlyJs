import { Entity } from "./entity.js";
import { Shapes } from "../rendering/shapes.js";
export class Sprite2D extends Entity {
    constructor(opt) {
        super();
        const descriptor = Object.assign(Object.assign({}, Shapes.rectangle()), { imageData: {
                image: opt.image,
                textureCoords: [
                    1, 1,
                    0, 1,
                    1, 0,
                    0, 0,
                ],
            } });
        if (opt.displacementMap)
            descriptor.imageData.displacementMap = opt.displacementMap;
        ;
        this._renderable = this.game.renderer.create(descriptor);
    }
    draw() {
        throw new Error("Method not implemented.");
    }
}

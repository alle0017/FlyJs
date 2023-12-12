import { Entity } from "./entity.js";
import { Shapes } from "../rendering/shapes.js";
export class Sprite2D extends Entity {
    get costume() {
        return this.animationVector[1] * this.costumes;
    }
    set costume(n) {
        var _a;
        if (n == this.animationVector[1] || n >= this.costumes || n < 0) {
            return;
        }
        this.animationVector[1] = n / this.costumes;
        if (this.appended) {
            (_a = this.game) === null || _a === void 0 ? void 0 : _a.renderer.setAttributes(this.id, { animationVector: this.animationVector });
        }
        else {
            this._renderable.attributes.animationVector = this.animationVector;
        }
    }
    get frame() {
        return this.animationVector[0] * this.frames;
    }
    set frame(n) {
        var _a;
        if (n == this.animationVector[0] || n >= this.frames || n < 0)
            return;
        this.animationVector[0] = n / this.frames;
        if (this.appended) {
            (_a = this.game) === null || _a === void 0 ? void 0 : _a.renderer.setAttributes(this.id, { animationVector: this.animationVector });
        }
        else {
            this._renderable.attributes.animationVector = this.animationVector;
        }
    }
    constructor(opt) {
        super();
        this.costumes = 1;
        this.frames = 1;
        this.animationVector = [0, 0];
        const descriptor = this.getRenderableDescription(opt);
        this._renderable = this.game.renderer.create(descriptor);
        this._renderable.attributes = { scale: { x: 1, y: 1, z: 1 } };
        this.z = -1;
    }
    getRenderableDescription(opt) {
        const scale = opt.scale || 1;
        const descriptor = {
            vertices: []
        };
        if (opt.frames)
            this.frames = opt.frames;
        if (opt.costumes)
            this.costumes = opt.costumes;
        if (opt.displacementMap)
            descriptor.imageData.displacementMap = opt.displacementMap;
        if (opt.image) {
            descriptor.imageData = {
                image: opt.image,
                textureCoords: [
                    0, 1 / this.costumes,
                    1 / this.frames, 1 / this.costumes,
                    1 / this.frames, 0,
                    0, 0,
                ],
            };
            const rect = Shapes.rectangle(0.15 * scale, 0.2 * scale);
            descriptor.indices = rect.indices;
            descriptor.vertices = rect.vertices;
            if (this.costumes > 1 || this.frames > 1)
                descriptor.imageData.animate = true;
        }
        else if (opt.vertices) {
            descriptor.vertices = opt.vertices;
            if (opt.indices) {
                descriptor.indices = opt.indices;
            }
            if (opt.colors) {
                descriptor.color = opt.colors;
            }
            else {
                descriptor.staticColor = { r: 1, g: 0, b: 0, a: 1 };
            }
        }
        descriptor.perspective = true;
        return descriptor;
    }
    createAnimation(animations) {
        let nextFrameTime = animations[0].deltaTime;
        let currFrame = animations[0].from;
        let i = 0;
        let times = animations[i].for || 0;
        this.costume = animations[0].costume;
        const animation = () => {
            const delta = this.game.loopController.timeFromStart;
            if (delta < nextFrameTime)
                return;
            this.costume = animations[i].costume;
            this.frame = currFrame;
            nextFrameTime = delta + animations[i].deltaTime;
            currFrame++;
            if (typeof animations[i].callback == 'function')
                animations[i].callback();
            if (currFrame > animations[i].to || currFrame > this.frames) {
                if (times) {
                    times--;
                    currFrame = animations[i].from;
                    animation();
                    return;
                }
                i++;
                if (i <= animations.length - 1)
                    animation();
                else
                    i = 0;
                times = animations[i].for || 0;
                currFrame = animations[i].from;
            }
        };
        return animation;
    }
}

import { Types, WormHoleScene, game } from './wormHole.js';
const color = [
    1.0, 0.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.1, 0.0, 1.0,
    1.0, 0.0, 0.5, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.1, 0.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.5, 1.0,
    1.0, 1.0, 1, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 0.4, 1.0, 1.0,
    0.0, 0.3, 1.0, 1.0,
];
const vertices = [
    0, 1, 0,
    0, -1, 0,
    2, 1, 0,
    2, -1, 0,
    4, 1, 0,
    4, -1, 0,
    6, 1, 0,
    6, -1, 0,
    8, 1, 0,
    8, -1, 0, // 9
];
const boneIndex = [
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 1, 0, 0,
    0, 1, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0,
    1, 2, 0, 0,
    1, 2, 0, 0,
    2, 0, 0, 0,
    2, 0, 0, 0, // 9
];
const weights = [
    1, 0, 0, 0,
    1, 0, 0, 0,
    .5, .5, 0, 0,
    .5, .5, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0,
    .5, .5, 0, 0,
    .5, .5, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0, // 9
];
const indices = [
    0, 1,
    0, 2,
    1, 3,
    2, 3,
    2, 4,
    3, 5,
    4, 5,
    4, 6,
    5, 7,
    6, 7,
    6, 8,
    7, 9,
    8, 9,
];
class FirstScene extends WormHoleScene {
    update() {
        this.$renderer.setAttributes('img', {
            translation: { x: 0, y: 0, z: -2 },
            scale: 0.1,
            bones: {
                angle: [
                    0, this.$game.refs.i, 0, this.$game.refs.i, 0
                ],
            }
        });
        this.$game.refs.i++;
        this.$renderer.draw();
    }
    onCreate(game) {
        this.$game.renderable.image = this.$renderer.create({
            vertices,
            indices,
            color,
            perspective: true,
            bonesData: {
                bones: 5,
                weights: weights,
                indices: boneIndex,
                root: 0
            },
            primitive: Types.Primitives.lines,
        });
        this.$game.refs.i = 0;
        //setup debug camera
        this.$debug.globalCamera();
        this.attach('img', this.$game.renderable.image, {
            translation: { x: 0, y: 0, z: -2 },
            scale: 0.1,
            bones: {
                angle: [
                    0, 60, 0, 0, 60
                ],
            }
        });
        //this.execute( this.update );
    }
    onDestroyed(game) { }
}
// finally, use the scene
game.useScene(FirstScene);

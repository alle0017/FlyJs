import { GameController } from './controller/gameController.js';
import { Primitives } from './rendering/types.js';
const game = await GameController.get();
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
// create new object that will be rendered
game.$renderable.image = game.$renderer.create({
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
    primitive: Primitives.lines,
});
const f = () => {
    game.$renderer.setAttributes('img', {
        translation: { x: 0, y: 0, z: -2 },
        scale: 0.1,
        bones: {
            angle: [
                0, game.$refs.i, 0, game.$refs.i, 0
            ],
        }
    });
    game.$refs.i++;
    game.$renderer.draw();
};
// create a scene
game.$scenes.first = game.createScene();
// set onEnter event
game.$scenes.first.onEnter(e => {
    if ('game' in e && e.game instanceof GameController) {
        // initialize i or create it if not exist already
        game.$refs.i = 0;
        //setup debug camera
        game.$debug.globalCamera();
    }
});
// add an object to the scene and set its default attributes
game.$scenes.first.attach('img', game.$renderable.image, {
    translation: { x: 0, y: 0, z: -2 },
    scale: 0.1,
    bones: {
        angle: [
            0, 60, 0, 0, 60
        ],
    }
});
// add function to the scene (it will be called when the scene is loaded)
game.$scenes.first.execute(f);
// finally, use the scene
game.useScene(game.$scenes.first);

import { Load } from './controller/loadData.js';
import { GameController } from './controller/gameController.js';
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
const texture = [
    // Front face
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
];
const img = await Load.image('pipeline.jpg');
const image = game.renderer.create({
    indices: [
        0, 1, 2,
        0, 2, 3,
    ],
    vertices: [
        -1, 1, 0,
        -1, -1, 0,
        1, -1, 0,
        1, 1, 0,
    ],
    imageData: {
        image: img,
        textureCoords: [
            1, 1,
            0, 1,
            0, 0,
            1, 0,
        ]
    },
});
game.renderer.append('img', image).setAttributes('img', {
    translation: { x: 0, y: 0, z: 0 },
    scale: 0.5
});
const f = () => {
    game.renderer.draw();
    requestAnimationFrame(f);
};
f();

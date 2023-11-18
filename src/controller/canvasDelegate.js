import { GameController } from './gameController.js';
const game = await GameController.get();
const f = () => {
    game.renderer.draw();
    requestAnimationFrame(f);
};
f();

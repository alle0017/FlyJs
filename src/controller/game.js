import { GLRenderer } from "../rendering/renderer.js";
class Game {
    constructor() {
        this.time = 0;
        this.functions = [];
        const cvs = document.createElement('canvas');
        if (!cvs)
            throw 'something went wrong with canvas creation';
        cvs.width = 800;
        cvs.height = 600;
        cvs.style.position = 'absolute';
        cvs.style.top = '0px';
        cvs.style.left = '0px';
        document.body.appendChild(cvs);
        this.renderer = new GLRenderer(cvs.getContext('webgl'));
    }
    static getInstance() {
        return this.instance;
    }
    loop() {
        const main = (time) => {
            this.time = time;
            for (let func of this.functions)
                func();
            requestAnimationFrame(main);
        };
        requestAnimationFrame(main);
    }
}
Game.instance = new Game();
export { Game };

import { Primitives, Axis } from "../rendering/types.js";
import { Camera } from "../rendering/matrix/camera.js";
export class Debug {
    constructor(game) {
        this.game = game;
        this.DEBUG_GRID_XY = '__debug_grid_xy';
        this.DEBUG_GRID_YZ = '__debug_grid_yz';
        this.DEBUG_GRID_XZ = '__debug_grid_xz';
        this.CELL_DIM = 0.8;
        this.END_OF_SCREEN = 1000;
    }
    cameraControllerComponent(camera) {
        const createSlider = (label, min, max, defaultVal = Math.round((max + min) / 2)) => {
            const input = document.createElement('input');
            const div = document.createElement('div');
            div.innerText = label;
            div.append(input);
            input.type = 'range';
            input.min = `{min}`;
            input.max = `{max}`;
            input.value = `{defaultVal}`;
            return { input, div };
        };
        const div = document.createElement("div");
        const xSlider = createSlider('x', -30, 30);
        const ySlider = createSlider('y', -30, 30);
        const zSlider = createSlider('z', -30, 30);
        const xyAngleSlider = createSlider('horizontal angle', 0, 360, 0);
        const zAngleSlider = createSlider('vertical angle', 0, 360, 0);
        xSlider.input.oninput = () => {
            camera.x = parseFloat(xSlider.input.value);
            this.game.renderer.setToAll({ camera: camera });
        };
        ySlider.input.oninput = () => {
            camera.y = parseFloat(ySlider.input.value);
            this.game.renderer.setToAll({ camera: camera });
        };
        zSlider.input.oninput = () => {
            camera.z = parseFloat(zSlider.input.value);
            this.game.renderer.setToAll({ camera: camera });
        };
        xyAngleSlider.input.oninput = () => {
            camera.rotationAxis = Axis.Y;
            camera.angle = parseFloat(xyAngleSlider.input.value);
            this.game.renderer.setToAll({ camera: camera });
        };
        zAngleSlider.input.oninput = () => {
            camera.rotationAxis = Axis.X;
            camera.angle = parseFloat(zAngleSlider.input.value);
            this.game.renderer.setToAll({ camera: camera });
        };
        div.append(xSlider.div);
        div.append(ySlider.div);
        div.append(zSlider.div);
        div.append(xyAngleSlider.div);
        div.append(zAngleSlider.div);
        div.style.width = '200px';
        div.style.height = '200px';
        div.style.backgroundColor = '#222';
        div.style.color = '#eee';
        div.style.padding = '10px';
        document.body.appendChild(div);
        return div;
    }
    removeGrids() {
        this.game.renderer.remove(this.DEBUG_GRID_XY);
        this.game.renderer.remove(this.DEBUG_GRID_YZ);
        this.game.renderer.remove(this.DEBUG_GRID_XZ);
    }
    drawXYGrid(color = { r: 1, g: 0, b: 0, a: 1 }) {
        const gridVertices = [];
        for (let i = 0; i < 300; i++) {
            gridVertices.push(-1, i * this.CELL_DIM - 1, 0, this.END_OF_SCREEN, i * this.CELL_DIM - 1, 0);
        }
        for (let i = 0; i < 300; i++) {
            gridVertices.push(i * this.CELL_DIM - 1, -1, 0, i * this.CELL_DIM - 1, this.END_OF_SCREEN, 0);
        }
        const grid = this.game.renderer.create({
            vertices: gridVertices,
            staticColor: color,
            primitive: Primitives.lines,
            perspective: true,
        });
        this.game.renderer.append(this.DEBUG_GRID_XY, grid);
        this.game.renderer.setAttributes(this.DEBUG_GRID_XY, {
            translation: { x: -15, y: -15, z: -1 },
        });
    }
    drawXZGrid(color = { r: 1, g: 0, b: 0, a: 1 }) {
        const gridVertices = [];
        for (let i = 0; i < 300; i++) {
            gridVertices.push(-1, -1, i * this.CELL_DIM, this.END_OF_SCREEN, -1, i * this.CELL_DIM);
        }
        for (let i = 0; i < 300; i++) {
            gridVertices.push(i * this.CELL_DIM - 1, -1, 0, i * this.CELL_DIM - 1, -1, i * this.END_OF_SCREEN);
        }
        const grid = this.game.renderer.create({
            vertices: gridVertices,
            staticColor: color,
            primitive: Primitives.lines,
            perspective: true
        });
        this.game.renderer.append(this.DEBUG_GRID_XZ, grid);
        this.game.renderer.setAttributes(this.DEBUG_GRID_XZ, {
            translation: { x: 0, y: 1, z: -15 },
        });
    }
    drawYZGrid(color = { r: 1, g: 0, b: 0, a: 1 }) {
        const gridVertices = [];
        for (let i = 0; i < 300; i++) {
            gridVertices.push(0, -1, i * this.CELL_DIM - 1, 0, this.END_OF_SCREEN, i * this.CELL_DIM - 1);
        }
        for (let i = 0; i < 300; i++) {
            gridVertices.push(0, i * this.CELL_DIM - 1, -1, 0, i * this.CELL_DIM - 1, this.END_OF_SCREEN);
        }
        const grid = this.game.renderer.create({
            vertices: gridVertices,
            staticColor: color,
            primitive: Primitives.lines,
        });
        this.game.renderer.append(this.DEBUG_GRID_YZ, grid);
        this.game.renderer.setAttributes(this.DEBUG_GRID_YZ, {
            translation: { x: 1, y: 0, z: -1 },
        });
    }
    globalCamera() {
        const camera = new Camera();
        this.cameraControllerComponent(camera);
        this.game.renderer.setToAll({ camera: camera });
    }
}

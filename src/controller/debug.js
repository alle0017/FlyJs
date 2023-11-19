import { Primitives } from "../rendering/types.js";
export class Debug {
    constructor(game) {
        this.game = game;
        this.DEBUG_GRID_XY = '__debug_grid_xy';
        this.DEBUG_GRID_YZ = '__debug_grid_yz';
        this.DEBUG_GRID_XZ = '__debug_grid_xz';
        this.CELL_DIM = 0.1;
        this.END_OF_SCREEN = 1000;
    }
    removeGrids() {
        this.game.renderer.remove(this.DEBUG_GRID_XY);
        this.game.renderer.remove(this.DEBUG_GRID_YZ);
        this.game.renderer.remove(this.DEBUG_GRID_XZ);
    }
    drawXYGrid(color = { r: 1, g: 0, b: 0, a: 1 }) {
        const gridVertices = [];
        for (let i = 0; i < 30; i++) {
            gridVertices.push(-1, i * this.CELL_DIM - 1, 0, this.END_OF_SCREEN, i * this.CELL_DIM - 1, 0);
        }
        for (let i = 0; i < 30; i++) {
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
            translation: { x: 0, y: 0, z: -1 },
        });
    }
    drawXZGrid(color = { r: 1, g: 0, b: 0, a: 1 }) {
        const gridVertices = [];
        for (let i = 0; i < 30; i++) {
            gridVertices.push(-1, -1, i * this.CELL_DIM, this.END_OF_SCREEN, -1, i * this.CELL_DIM);
        }
        for (let i = 0; i < 30; i++) {
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
            translation: { x: 0, y: 1, z: -1 },
        });
    }
    drawYZGrid(color = { r: 1, g: 0, b: 0, a: 1 }) {
        const gridVertices = [];
        for (let i = 0; i < 30; i++) {
            gridVertices.push(0, -1, i * this.CELL_DIM, 0, this.END_OF_SCREEN, i * this.CELL_DIM);
        }
        for (let i = 0; i < 30; i++) {
            gridVertices.push(0, i * this.CELL_DIM - 1, 0, 0, i * this.CELL_DIM - 1, i * this.END_OF_SCREEN);
        }
        const grid = this.game.renderer.create({
            vertices: gridVertices,
            staticColor: color,
            primitive: Primitives.lines,
            static: true,
        });
        this.game.renderer.append(this.DEBUG_GRID_YZ, grid);
        this.game.renderer.setAttributes(this.DEBUG_GRID_YZ, {
            translation: { x: 1, y: 0, z: -1 },
        });
    }
}

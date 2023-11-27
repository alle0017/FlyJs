import { GameController } from "./controller/gameController.js";
import { EventEmitter } from "./controller/eventController.js";
import { Load as load } from "./controller/loadData.js";
import { Scene as scene } from "./controller/scene.js";
import { CustomScene } from "./controller/customScene.js";
import { Entity as entity } from "./entities/entity.js";
import { Sprite2D as sprite2d } from "./entities/sprite2D.js";
import { Sprite3D as sprite3d } from "./entities/sprite3D.js";
import { Matrix as matrix } from "./rendering/matrix/matrices.js";
import * as types from './rendering/types.js';
import { Shapes as shapes } from "./rendering/shapes.js";
export const game = await GameController.get();
export const $renderer = game.renderer;
export const $assets = game.assets;
export const $debug = game.debug;
export const $events = EventEmitter;
export const Entity = entity;
export const WormHoleSprite2D = sprite2d;
export const Sprite2D = sprite2d;
export const WormHoleSprite3D = sprite3d;
export const Sprite3D = sprite3d;
export const Matrix = matrix;
export const Load = load;
export const Types = types;
export const Scene = scene;
export const Shapes = shapes;
export const WormHoleScene = CustomScene;
export const bug = console.trace;

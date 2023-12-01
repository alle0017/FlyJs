import { GameController } from "./controller/gameController.js";
import { EventEmitter } from "./controller/eventController.js";
import { Load as load } from "./controller/loadData.js";
import { Scene as scene } from "./controller/scene.js";
import { CustomScene } from "./controller/customScene.js";

import { Entity as entity } from "./entities/entity.js";
import { Sprite2D as sprite2d } from "./entities/sprite2D.js";
import { Sprite3D as sprite3d } from "./entities/sprite3D.js";

import { Matrix as matrix } from "./rendering/matrix/matrices.js";
import * as types from './rendering/types.js'
import { Shapes as shapes } from "./rendering/shapes.js";

export const game = await GameController.get();
export type FlyGame = GameController;

export const $renderer = game.renderer;
export const $assets = game.assets;
export const $debug = game.debug;
export const $events = EventEmitter;

export const Entity = entity;
export const FlySprite2D = sprite2d;
export const Sprite2D = sprite2d;
export const FlySprite3D = sprite3d;
export const Sprite3D = sprite3d;

export const Matrix = matrix;
export const Load = load;
export const Types = types;
export const Scene = scene;
export const Shapes = shapes;

export const FlyScene = CustomScene;
export const bug = ( obj?: unknown ) =>{
      if( !obj ){
            console.log( obj );
            console.trace();
            return;
      }
      console.log(`%c${obj.constructor.name}:` , 'color: #2f2; font-size: larger;');
      console.log(`${obj.constructor}:`)

      console.table(obj);
      for( let [key, value] of Object.entries(obj) ){
            console.log(`%c${key}`, 'color: yellow; font-size: larger;')
            console.table( value );
      }
      console.log( '%cSTACK TRACE', 'color: cyan; font-size: larger;' )
      console.trace();
};
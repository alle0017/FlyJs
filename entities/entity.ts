import { Renderable } from "../rendering/types.js";
import { GameController } from "../controller/gameController.js";
import { Matrix } from '../rendering/matrix/matrices.js'

export abstract class Entity {
      private static UNIQUE_ID = 0;
      private static readonly COMMON_ID: string = 'ENTITY_';

      private _x: number = 0;
      private _y: number = 0;
      private _z: number = 0;
      private _id: string;
      appended: boolean = false;

      vx: number = 0;
      vy: number = 0;
      vz: number = 0;
      ax: number = 0;
      ay: number = 0;
      az: number = 0;
      game?: GameController;

      protected abstract _renderable: Renderable;
      get x(){
            return this._x;
      }
      set x(x: number) {
            if( this._x === x ) 
                  return;
            this._x = x;
            const matrix = Matrix.translate({ x: this._x, y: this._y , z: this._z });
            if( this.appended ){
                  this.game?.renderer.setAttributes(this._id, { translationMatrix: matrix });
            }else{
                  this._renderable.attributes.translationMatrix = matrix;
            }
      }
      get y(){
            return this._y;
      }
      set y(y: number) {
            if( this._y === y ) 
                  return;
            this._y = y;
            const matrix = Matrix.translate({ x: this._x, y: this._y , z: this._z });
            if( this.appended ){
                  this.game?.renderer.setAttributes( this._id, { translationMatrix: matrix } );
            }else{
                  this._renderable.attributes.translationMatrix = matrix;
            }
      }
      get z(){
            return this._z;
      }
      set z(z: number) {
            if( this._z === z ) 
                  return;
            this._z = z;
            const matrix = Matrix.translate({ x: this._x, y: this._y , z: this._z });
            if( this.appended ){
                  this.game?.renderer.setAttributes(this._id, { translationMatrix: matrix });
            }else{
                  this._renderable.attributes.translationMatrix = matrix;
            }
      }
      get id(){
            return this._id;
      }
      set id(id: string) {
            console.warn( 'cannot set id' )
      }
      get renderable(){
            return this._renderable;
      }
      set renderable(renderable: Renderable) {}

      constructor(){
            GameController.get().then( value => this.game = value );
            this._id = Entity.COMMON_ID + Entity.UNIQUE_ID;
            Entity.UNIQUE_ID++;
      }
      abstract draw(): void;

}
import { Point, DrawOpt, Axis } from '../rendering/generics.js'
import { Matrix } from '../rendering/matrices.js';

export abstract class Entity{

      /**
      * used for translation in space
       */
      protected _position: Point;
      /**
      * used for scaling
       */
      protected _scale: number | Point;
      /**
      * used for rotate in space
       */
      protected _angle: number = 0;
      protected _axis = Axis.X;
      /**
      * used to indicate whether angle needs to be converted to radians
       */
      toRad: boolean = true;

      width: number;
      height: number;
      depth: number;

      protected _transformationMatrix: number[] = Matrix.IDENTITY_4X4;

      set position(position: Point) {
            if(
                  position.x !== this._position.x && 
                  position.y !== this._position.y && 
                  position.z !== this._position.z){
                  this._position = position;
                  this.setTransformationMatrix();
            }
      }
      get position(): Point {
            return this._position;
      }

      set angle(angle: number){
            if(angle !== this._angle){
                  this._angle = angle;
                  this._transformationMatrix;
            }
      }
      get angle(){ 
            return this._angle;
      }

      set scale(scale: Point | number){
            if(this._scale !== scale){
                  this._scale = scale;
                  this.setTransformationMatrix();
                  if(typeof scale === 'number'){
                        this.width *= scale;
                        this.height *= scale;
                        this.depth *= scale;
                  }else{
                        this.width *= scale.x;
                        this.height *= scale.y;
                        this.depth *= scale.z;
                  }
            }
      }
      get scale(){
            return this._scale;
      }

      set x(x: number) { 
            if(this._position.x !== x){
                  this._position.x = x; 
                  this.setTransformationMatrix();
            }
      }
      get x() { return this._position.x; }

      set y(y: number) { 
            if(this._position.y !== y){
                  this._position.y = y; 
                  this.setTransformationMatrix();
            }
      }
      get y() { return this._position.y; }

      set z(z: number) { 
            if(this._position.z !== z){
                  this._position.z = z; 
                  this.setTransformationMatrix();
            }
      }
      get z() { return this._position.z; }

      constructor(){
            this._position = {
                  x: 0,
                  y: 0,
                  z: 0,
            };
            this.width = 1;
            this.height = 1;
            this.depth = 1;
            this._scale = 1;
      }

      protected setTransformationMatrix(){
            this._transformationMatrix = Matrix.composeMatrix(
                  Matrix.IDENTITY_4X4, 
                  4, 
                  Matrix.translate(this._position)
            );
            this._transformationMatrix = Matrix.composeMatrix(
                  this._transformationMatrix,
                  4,
                  Matrix.rotation(this._angle, this._axis)
            );
            this._transformationMatrix = Matrix.composeMatrix(
                  this._transformationMatrix,
                  4,
                  Matrix.scale(this._scale)
            );

      }

      abstract draw(opt: DrawOpt): void;
}
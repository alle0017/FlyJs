import { Point, DrawOpt, Axis } from '../rendering/generics.js'
import { Matrix } from '../rendering/matrix/matrices.js';

/**
 * An abstract class representing an entity in 3D space.
 */
export abstract class Entity {

      /**
       * Position of the entity in 3D space.
       */
      protected _position: Point;
  
      /**
       * Scale of the entity in 3D space.
       */
      protected _scale: number | Point;
  
      /**
       * Rotation angle of the entity in 3D space.
       */
      protected _angle: number = 0;
  
      /**
       * The axis of rotation for the entity.
       */
      protected _axis = Axis.X;
  
      /**
       * Flag indicating whether the angle should be converted to radians.
       */
      toRad: boolean = true;
  
      /**
       * Width of the entity.
       */
      width: number;
  
      /**
       * Height of the entity.
       */
      height: number;
  
      /**
       * Depth of the entity.
       */
      depth: number;
  
      /**
       * Transformation matrix representing the combined transformations of the entity.
       */
      protected _transformationMatrix: number[] = Matrix.IDENTITY_4X4;
  
      /**
       * Set the position of the entity in 3D space.
       * @param {Point} position - The new position of the entity.
       */
      set position(position: Point) {
            if (
                  position.x !== this._position.x &&
                  position.y !== this._position.y &&
                  position.z !== this._position.z
            ) {
                  this._position = position;
                  this.setTransformationMatrix();
            }
      }
  
      /**
       * Get the position of the entity in 3D space.
       * @returns {Point} - The position of the entity.
       */
      get position(): Point {
            return this._position;
      }
  
      /**
       * Set the rotation angle of the entity.
       * @param {number} angle - The new rotation angle of the entity.
       */
      set angle(angle: number) {
            if (angle !== this._angle) {
                  this._angle = angle;
                  this.setTransformationMatrix();
            }
      }
  
      /**
       * Get the rotation angle of the entity.
       * @returns {number} - The rotation angle of the entity.
       */
      get angle(): number {
            return this._angle;
      }
  
      /**
       * Set the scale of the entity in 3D space.
       * @param {Point | number} scale - The new scale of the entity.
       */
      set scale(scale: Point | number) {
            if (this._scale !== scale) {
                  this._scale = scale;
                  this.setTransformationMatrix();
      
                  // Adjust width, height, and depth based on scale
                  if (typeof scale === 'number') {
                        this.width *= scale;
                        this.height *= scale;
                        this.depth *= scale;
                  } else {
                        this.width *= scale.x;
                        this.height *= scale.y;
                        this.depth *= scale.z;
                  }
            }
      }
  
      /**
       * Get the scale of the entity in 3D space.
       * @returns {Point | number} - The scale of the entity.
       */
      get scale(): number | Point { 
            return this._scale;
      }
  
      /**
       * Set the x-coordinate of the entity's position.
       * @param {number} x - The new x-coordinate.
       */
      set x(x: number) {
            if (this._position.x !== x) {
                  this._position.x = x;
                  this.setTransformationMatrix();
            }
      }
  
      /**
       * Get the x-coordinate of the entity's position.
       * @returns {number} - The x-coordinate.
       */
      get x(): number {
            return this._position.x;
      }
  
      /**
       * Set the y-coordinate of the entity's position.
       * @param {number} y - The new y-coordinate.
       */
      set y(y: number) {
            if (this._position.y !== y) {
                  this._position.y = y;
                  this.setTransformationMatrix();
            }
      }
  
      /**
       * Get the y-coordinate of the entity's position.
       * @returns {number} - The y-coordinate.
       */
      get y(): number {
            return this._position.y;
      }
  
      /**
       * Set the z-coordinate of the entity's position.
       * @param {number} z - The new z-coordinate.
       */
      set z(z: number) {
            if (this._position.z !== z) {
                  this._position.z = z;
                  this.setTransformationMatrix();
            }
      }
  
      /**
      * Get the z-coordinate of the entity's position.
      * @returns {number} - The z-coordinate.
      */
      get z() {
            return this._position.z;
      }
  
      /**
       * Constructor for the Entity class.
       */
      constructor() {
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
  
      /**
       * Sets the transformation matrix based on position, rotation, and scale.
       */
      protected setTransformationMatrix() {
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
  
      /**
       * Abstract method for drawing the entity.
       * @param {DrawOpt} opt - Drawing options.
       */
      abstract draw(opt: DrawOpt): void;
}
  
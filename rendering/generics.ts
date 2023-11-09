import { Camera } from "./matrix/camera.js";
/**
 * @enums with the type of axis (X, Y, Z)
 */
export enum Axis {
      X = 'x',
      Y = 'y',
      Z = 'z'
}
/**
 * @type of axis.
 * @see {@link Axis} to access this type
 */
export type AxisType = 'x' | 'y' | 'z';
/**
 * @type of colors. rgba components
 */
export type Color = {
      r: number;
      g: number;
      b: number;
      a: number;
}
export type DrawFunction = (opt?: DrawOpt)=>void;
export interface Renderer {
      getDrawElementFunction(arg1: number[], arg2: number[], arg3?: number[], arg4?: any): DrawFunction | null;
      getDrawElementWithTextureFunction(arg1: any, arg2: any, arg3: any): DrawFunction | null;
      clear(color: Color): void;
}
export type DrawOpt = {
      angle?: number;
      /**
       * 'x' 'y' or 'z'
       * @use Axis in generics.ts as enum to represent the different axis
       */
      axis?: AxisType;
      /**
       * whether or not to convert angle to radiants
       */
      toRad?: boolean;
      /**
       * the rotation matrix 3d, so a 4x4 matrix ( you can use Matrix.rotate to get once)
       * @see Matrix in matrix.ts
       */
      rotationMatrix?: number[];
      /**
       * the translation matrix 3d, so a 4x4 matrix ( you can use Matrix.translate to get once)
       * @see Matrix in matrix.ts
       */
      translationMatrix?: number[];
      /**
       * 3d vector that translate (moves) the element in the space
       */
      translation?: Point;
      /**
       * projection matrix 
       * @TODO add someway of projection matrix generation in Matrix
       */
      projectionMatrix?: number[];
      /**
      * the scale to use for reduce/enlarge objects
      */
      scale?: number | Point;
      /**
      * the scale matrix 3d, so a 4x4 matrix ( you can use Matrix.scale to get once)
      * @see Matrix in matrix.ts
      */
      scaleMatrix?: number[];
      camera?: Camera;
      transformationMatrix?: number[];
      /**
       * vectors that indicate where the actual frame and costume of image atlas (sprite sheet) you want to draw
       */
      animationVector?: [number, number];
}
export type Point = { 
      x: number; 
      y: number; 
      z: number; 
}
export type DrawableElementAttributes = {
      vertices: number[];
      color?: number[];
      indices?: number[];
      textureCoords?: number[];
      image?: HTMLImageElement; 
      animate?: boolean;
}


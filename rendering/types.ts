import { Camera } from "./matrix/camera.js";

type DrawableElementOptions = {
      color: number[];
      indices: number[];
      staticColor: Color;
      static: boolean;
      perspective: boolean;
      imageData: DrawableImageOptions;
      primitive: Primitives;
      bonesData: SkeletalAnimationOptions;
};
type DrawableElementEssential = {
      vertices: number[];
} 


export enum BufferUsage {
      vertex,
      index,
      uniform,
}
export enum Axis  {
      X = 'x',
      Y = 'y',
      Z = 'z',
}
export enum ProgramMode {
      webgpu = 1,
      webgl
}

export enum Primitives {
      triangles = 1,
      points,
      lines,
      lines_strip,
      triangles_strip,
}
export enum RendererErrorType {
      creation = 'creation',
      initialization = 'initialization',
      acquisition = 'acquisition',
}
export enum BufferDataType {
      uint16 = 1,
      float32,
}
export type Color = {
      r: number;
      g: number;
      b: number;
      a: number;
}
export type SkeletalAnimationOptions = {
      bones: number;
      weights: number[];
      indices: number[];
      root: number;
}
export type DrawableImageOptions = {
      textureCoords: number[];
      image: ImageBitmap; 
      animate?: boolean;
      displacementMap?: ImageBitmap;
}
export type Point2D = {
      x: number;
      y: number;
}
export type Point3D = Point2D & { z: number };
export type DrawOpt = {
      angle?: number;
      /**
       * 'x' 'y' or 'z'
       * @use Axis in generics.ts as enum to represent the different axis
       */
      axis?: Axis;
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
      translation?: Point3D;
      /**
       * projection matrix 
       * @TODO add someway of projection matrix generation in Matrix
       */
      projectionMatrix?: number[];
      /**
      * the scale to use for reduce/enlarge objects
      */
      scale?: number | Point3D;
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
      bumpScale?: number;
      bones?: {
            angle?: number[];
            translate?: Point3D[];
      }
}

export type DrawableElementAttributes =  DrawableElementEssential & Partial<DrawableElementOptions>;

export type BufferOpt = {
      data: number[],
      dataType: BufferDataType,
      arrayByteLength: number, 
      usage: number, 
      label: string,
}

export type BufferData = {
      dataType: string,
      shaderLocation: number,
      components: number,
      offset: number,
      name: string,
      size: number,
}


export type ProgramOpt = {
      vShader: string, 
      fShader: string, 
      topology?: Primitives,
      vEntryPoint?: string,
      fEntryPoint?: string,
      enableDepth?: boolean,
      buffers: BufferData[],
      stride: number,
}

export type RenderFunction = (arg0: any) => void;

export type TypedArray = Float32Array | Uint16Array;

export type TypedArrayConstructor = Float32ArrayConstructor | Uint16ArrayConstructor;

export type ShapesProperties = {
      indices: number[],
      vertices: number[]
}
export type GPUCodeProperties = {
      attributesData: Map<string, number[]>;
      unifiedAttributeBuffer: number[];
      fragment: string;
      vertex: string;
      attributes: Map<string,BufferData>;
      uniforms: Map<string,BufferData>;
      attributeStride: number;
      uniformStride: number;
      uniformsName: string[];
      bindings?: string[];
}
export type AttribsInfo = {
      buffer: WebGLBuffer,
      location: number,
      components: number,
}
export type UniformsInfo = {
      //buffer: WebGLBuffer,
      location: WebGLUniformLocation,
      components: number,
      type: string
      value: number | number[]
}
export type WebGPURenderable = {
      function: (arg0: any) => void,
      skeleton: Skeleton,
      uniformsName: string[],
      attributes: DrawOpt,
      buffers: {
            bones: GPUBuffer | undefined,
            transformations: GPUBuffer | undefined
      }
}
export type WebGLRenderable = {
      function: (arg0: any) => void,
      skeleton: Skeleton,
      uniforms: Map<string, UniformsInfo>,
      attributes: DrawOpt,
}
export type Renderable = WebGPURenderable | WebGLRenderable;
export type RenderableArrays = {
      bones: number[],
      transformations: number[],
}
export type Bone = {
      // initial position of the bone
      inversePose: number[],
      // matrix that represents the local transformation
      // in global reference
      transformationMatrix: number[],
}
export type Skeleton = {
      bones: Bone[],
      indices: number[],
      // root node of the skeleton
      root: number
}
export type TypedArray = Float32Array | Uint16Array;


export type DrawFunction = ()=>void;

export type Color = {
      r: number;
      g: number;
      b: number;
      a: number;
}
type DrawableImageOptions = {
      textureCoords: number[];
      image: HTMLImageElement; 
      animate?: boolean;
      displacementMap?: boolean;
}
type DrawableElementOptions = {
      color: number[];
      indices: number[];
      staticColor: Color;
      static: boolean;
      perspective: boolean;
} & DrawableImageOptions;



type DrawableElementEssential = {
      vertices: number[];
} 
export type DrawableElementAttributes =  DrawableElementEssential & Partial<DrawableElementOptions>;

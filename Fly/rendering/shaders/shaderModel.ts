import * as Types from '../types.js'

export type ProgramInfo = { 
      fragment: string; 
      vertex: string; 
      attributes: Map<string, Types.BufferData>;
      uniforms: Map<string, Types.BufferData>;
      bindings?: string[];
      attributeStride: number;
      uniformStride: number;
      uniformsName: string[];
};

export enum AttributesName {
      vertex = 'vertex_position',
      color = 'color',
      textureCoordinates = 'texture_coords',
      skIndices = 'sk_indices',
      skWeights = 'weights',
}
export enum UniformsName {
      perspective = 'perspective',
      transformation = 'transformation',
      bumpScale = 'bump_scale',
      framePosition = 'frame_position',
      //bones
}
export enum BindingsName {
      texture = 'texture',
      textureSampler = 'texture_sampler',
      displacementMap = 'displacement_map',
      bones = 'bones',
}
export type TypeInfos = {
      type: string;
      components: number;
      size: number;
}

export abstract class Shader {
      static readonly FRAGMENT = 0;
      static readonly VERTEX = 1;

      static MAT3x2 = 0;
      static MAT2x2 = 1;
      static MAT3x3 = 2;
      static MAT4x4 = 3;

      static VEC2 = 4;
      static VEC3 = 5;
      static VEC4 = 6;

      static INT = 10;
      static FLOAT = 7;
      static BOOL = 9;

      static TEXTURE2D = 8;
      static SAMPLER = 11;

      static types: string[] = [];

      protected varyings: string[] = [];
      protected attributes: string[] = [];
      protected uniforms: string[] = [];

      protected positionTransformations: string[] = [];

      protected vCode: string[] = [];
      protected fCode: string[] = [];

      protected fragmentReturnedValue: string = '';
      protected vertexReturnedValue: string = '';


      protected _attributesData: Map<string,Types.BufferData> = new Map<string,Types.BufferData>();
      protected _uniformsData: Map<string,Types.BufferData> = new Map<string,Types.BufferData>();

      protected _functions: string = '';

      constructor(){}     

      

      protected abstract getType(type: number): string;

      protected abstract resetVariables(): this;


      protected abstract getFragment(): string;

      protected abstract getVertex(): string;

        
      protected abstract getUniformsDefinition(a0: any): string;

      protected abstract getVaryingsDefinition(): string;

      protected abstract getAttributesDefinition(): string;

      protected abstract getPositionTransformations(): string;


      protected abstract addAttribute(name: string, type: number): this;

      protected abstract addUniform(name: string, type: number, arg0: any): this;

      protected abstract addVarying(name: string, type: number): this;


      abstract usePerspective(): this;

      abstract useDynamicElement(): this;

      abstract useAnimation2D(): this;

      abstract useTexture(): this;

      abstract useInterpolatedColor(): this;

      abstract useUniformColor(r: number, g: number, b: number, a: number): this;

      abstract useDisplacementMap(): this;

      /**@see https://veeenu.github.io/blog/implementing-skeletal-animation/ */
      abstract useSkeletalAnimation(  bones: number ): this;


      abstract get(): ProgramInfo;

}
import { TypedArray } from "rendering/rendererModel";
import { Uniform } from '../rendererModel';

export type ShaderCode = { 
      fragment: string; 
      vertex: string; 
};

export type DataLayoutInfos = {
      type: GPUVertexFormat;
      size: number;
      bindingLocation: number;
      offset: number;
      components: number;
      stride: number;
      normalize: boolean;
      dataType: number;
      data?: number[];
}
/*

      useAnimation2D(): this {

            if( this.varyings.join().indexOf('texture_coords') < 0 ){
                  console.warn('cannot use 2d animation in a non-textured element');
                  return this;
            }

            this
            .useTexture()
            .addUniform('frame_position', WebGPUShader.VEC2);

            this.fCode.push(`
            ${this.VARYING_VARIABLE}.texture_coords.x += ${this.UNIFORMS_VARIABLE}.frame_position.x;
            ${this.VARYING_VARIABLE}.texture_coords.y += ${this.UNIFORMS_VARIABLE}.frame_position.y; 
            `);
            return this;
      }
      useTexture(): this {

            this
            .resetVariables()
            .addAttribute('vertex_position', WebGPUShader.VEC3)
            .addAttribute('texture_coords', WebGPUShader.VEC2)
            .addBinding('texture_sampler', WebGPUShader.SAMPLER)
            .addBinding('texture', WebGPUShader.TEXTURE2D)
            .addVarying('texture_coords', WebGPUShader.VEC2);

            this.vCode.push(`
            var out: ${this.VARYING_STRUCT};
            out.position = ${this.DEFAULT_VERTEX_RETURNED_VALUE};
            out.texture_coords = ${this.ATTRIBUTES_VARIABLE}.texture_coords;
            `);
            this.vertexReturnedValue = 'out';
            this.fragmentReturnedValue = `textureSample(texture, texture_sampler, ${this.VARYING_VARIABLE}.texture_coords)`
            return this;
      }
      useInterpolatedColor(): this {
            this
            .resetVariables()
            .addAttribute('vertex_position', WebGPUShader.VEC3)
            .addAttribute('color', WebGPUShader.VEC4)
            .addVarying('color', WebGPUShader.VEC4);
            
            this.vCode.push(`
                  var out: ${this.VARYING_STRUCT};
                  out.position = ${this.DEFAULT_VERTEX_RETURNED_VALUE};
                  out.color = ${this.ATTRIBUTES_VARIABLE}.color;
            `)
            this.vertexReturnedValue = 'out';
            this.fragmentReturnedValue = `${this.VARYING_VARIABLE}.color`
            return this;
      }
      useUniformColor(r: number, g: number, b: number, a: number = 1): this {

            this
            .resetVariables()
            .addAttribute('vertex_position', WebGPUShader.VEC3);

            this.vCode.push(`
            var out = ${this.DEFAULT_VERTEX_RETURNED_VALUE};
            `);

            this.vertexReturnedValue = 'out';
            this.fragmentReturnedValue = `vec4f(${r}, ${g}, ${b}, ${a})`;
            return this;
      }
      useDisplacementMap(): this {

            if( this.attributes.join().indexOf('texture_coords') < 0 ){
                  console.warn('cannot use displacement map in a non-textured element');
                  return this;
            }

            this
            .addBinding('displacement_map', WebGPUShader.TEXTURE2D)
            .addUniform('bump_scale', WebGPUShader.FLOAT);
            this.vCode.push(`
                  var height = textureSampleLevel( displacement_map, texture_sampler, ${this.ATTRIBUTES_VARIABLE}.texture_coords, 0.0 );
                  out.position.y += ${this.UNIFORMS_VARIABLE}.bump_scale * height;
            `);
            
            return this;
      }
*/
export enum AttributesName {
      vertex = 'vertex_position',
      color = 'color',
      textureCoordinates = 'texture_coords',
}
export enum UniformsName {
      perspective = 'perspective',
      transformation = 'transformation',
      bumpScale = 'bump_scale',
      framePosition = 'frame_position'
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


      protected _attributesData: Map<string,DataLayoutInfos> = new Map<string,DataLayoutInfos>();
      protected _uniformsData: Map<string,DataLayoutInfos> = new Map<string,DataLayoutInfos>();

      get attributesData(): Map<string,DataLayoutInfos> {
            return this._attributesData;
      }
      
      protected set attributesData(data: Map<string,DataLayoutInfos>) { }

      get uniformsData(): Map<string,DataLayoutInfos> {
            return this._uniformsData;
      }
      
      protected set uniformsData( data: Map<string,DataLayoutInfos> ) { }

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
      //TODO: abstract skeletalAnimation(): this;


      abstract get(): ShaderCode;

}
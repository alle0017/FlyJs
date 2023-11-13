import * as Model from './shaderModel2.js';
import { AttributesName as AN, UniformsName as UN } from './shaderModel2.js';


type TypeInfos = {
      type: GPUVertexFormat;
      components: number;
      size: number;
}

export class WebGPUShader extends Model.Shader {
      
      private vInput: string = '';
      private fInput: string = '';
      private bindings: string[] = [];
      private attributeBindingLocation: number = 0;
      private varyingBindingLocation: number = 0;
      private groupBindingLocation: number = 1;

      private readonly VARYING_STRUCT: string = 'Varyings';
      private readonly UNIFORMS_STRUCT: string = 'Uniforms';
      private readonly ATTRIBUTES_STRUCT: string = 'VertexInput';


      private readonly UNIFORMS_VARIABLE: string = 'uniforms';
      private readonly ATTRIBUTES_VARIABLE: string = 'vInput';
      private readonly VARYING_VARIABLE: string = 'fInput';
      private readonly DEFAULT_VERTEX_RETURNED_VALUE: string = `vec4f(${this.ATTRIBUTES_VARIABLE}.${AN.vertex}, 1)`;

      private static typeSize: TypeInfos[] = [];

      bindingsInfo: [] = [];

      private attribOffset: number = 0;
      private uniformOffset: number = 0;


      protected addAttributesInfo( name: string, type: number, bindingLocation: number ): void {  

            const typeInfo = WebGPUShader.typeSize[type]? 
                  WebGPUShader.typeSize[type]: 
                  {type: '', components: 0, size: 0};
            
            this._attributesData.set(name, {
                  dataType: typeInfo.type,
                  shaderLocation: bindingLocation,
                  components: typeInfo.components,
                  offset: this.attribOffset,
                  name,
                  size: typeInfo.size
            });
            this.attribOffset += typeInfo.components * typeInfo.size;
      }

      protected addUniformInfo( name: string, type: number, bindingLocation: number ): void {

            const typeInfo = WebGPUShader.typeSize[type]? 
                  WebGPUShader.typeSize[type]: 
                  {type: '', components: 0, size: 0};
            
            this._uniformsData.set(name, {
                  dataType: typeInfo.type,
                  shaderLocation: bindingLocation,
                  components: typeInfo.components,
                  offset: this.uniformOffset,
                  name,
                  size: typeInfo.size
            });
            this.uniformOffset += typeInfo.components * typeInfo.size;
      }


      static setTypes(){
            this.types = [];
      
            this.types[this.MAT4x4] = 'mat4x4f';
            this.types[this.MAT3x3] = 'mat3x3f';
            this.types[this.MAT2x2] = 'mat2x2f';
            this.types[this.MAT3x2] = 'mat3x2f';
      
            this.types[this.VEC4] = 'vec4f';
            this.types[this.VEC3] = 'vec3f';
            this.types[this.VEC2] = 'vec2f';
      
            this.types[this.TEXTURE2D] = 'texture_2d<f32>';
            this.types[this.SAMPLER] = 'sampler';
                  
      
            this.types[this.INT] = 'i32';
            this.types[this.FLOAT] = 'f32';
            this.types[this.BOOL] = 'bool';

            this.typeSize[this.VEC4] = {type: 'float32', components: 4, size: 4};
            this.typeSize[this.VEC3] = {type: 'float32', components: 3, size: 4};
            this.typeSize[this.VEC2] = {type: 'float32', components: 2, size: 4};

            this.typeSize[this.INT] = {type: 'sint32', components: 1, size: 4};
            this.typeSize[this.FLOAT] = {type: 'float32', components: 1, size: 4};
            //uniforms => type is patched
            this.typeSize[this.MAT4x4] = {type: 'float32', components: 16, size: 4};
            this.typeSize[this.MAT3x3] = {type: 'float32', components: 9, size: 4};
            this.typeSize[this.MAT2x2] = {type: 'float32', components: 4, size: 4};
            this.typeSize[this.MAT3x2] = {type: 'float32', components: 6, size: 4};
      }

      protected resetVariables(): this {
            this.uniforms = [];
            this.varyings = [];
            this.attributes = [];
            this.bindings = [];

            this.vCode = [];
            this.fCode = [];

            this.fInput = '';
            this.vInput = '';

            this.varyingBindingLocation = 0;
            this.attributeBindingLocation = 0;
            this.groupBindingLocation = 1;

            this.fragmentReturnedValue = '';
            this.vertexReturnedValue = '';

            this._attributesData.clear();
            this._uniformsData.clear();

            return this;
      }
      protected getType(type: number): string {

            if(!WebGPUShader.types[type])
                  throw 'type not recognized '+ type;
            return WebGPUShader.types[type];
      }


      protected getUniformsDefinition(): string {
            if(this.uniforms.length <= 0) return '';
            return `
            struct ${this.UNIFORMS_STRUCT}{
                  ${this.uniforms.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`)}
            }
            @group(0) @binding(0) var<uniform> ${this.UNIFORMS_VARIABLE}: ${this.UNIFORMS_STRUCT};
            `
      }
      protected getVaryingsDefinition(): string {
            if(this.varyings.length <= 0) return '';
            return `
            struct ${this.VARYING_STRUCT}{
                  @builtin(position) position: vec4f,
                  ${this.varyings.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`)}
            }
            `
      }
      protected getAttributesDefinition(): string {
            if(this.attributes.length <= 0) return '';
            return `
            struct ${this.ATTRIBUTES_STRUCT}{
                  ${this.attributes.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`)}
            }
            `
      }
      protected getPositionTransformations(): string {
            const transformations =  this.positionTransformations.length? 
                  this.positionTransformations.reduce((prev, next)=> `${prev} * ${next}`) + ' *' : '';
            const code = this.varyings.length? 
                  `
                  ${this.vertexReturnedValue}.position = ${transformations} ${this.vertexReturnedValue}.position;
                  return ${this.vertexReturnedValue};
                  `: 
                  `return ${transformations} ${this.vertexReturnedValue};`;
            return code;
      }


      protected getVertex(): string {
            const code = this.vCode.length? 
            this.vCode.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`): 
            '';
            return `
            ${this.getUniformsDefinition()}
            ${this.getVaryingsDefinition()}
            ${this.getAttributesDefinition()}
            ${this.bindings.length > 0? this.bindings.reduce((prev, next)=> `${prev}\n${next}`) : ''}
            @vertex
            fn vertex_shader(${this.vInput})->${
                  this.varyings.length ? 
                  this.VARYING_STRUCT:
                  '@builtin(position) vec4f'}{
                  ${code}
                  ${this.getPositionTransformations()}
            }
            `;
      }
      protected getFragment(): string {
            const code = this.fCode.length? 
            this.fCode.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`): 
            '';
            return `
            @fragment
            fn fragment_shader(${this.fInput})-> @location(0) vec4f {
                  ${code}
                  return ${this.fragmentReturnedValue};
            }
            `;
      }


      protected addAttribute(name: string, type: number): this {

            this.addAttributesInfo( name, type, this.attributeBindingLocation );

            this.vInput = `${this.ATTRIBUTES_VARIABLE}: ${this.ATTRIBUTES_STRUCT}`;
            this.attributes.push(`@location(${this.attributeBindingLocation}) ${name}: ${this.getType(type)},`);
            this.attributeBindingLocation++;
            return this;
      }
      protected addUniform(name: string, type: number): this {
            this.addUniformInfo( name, type, 0 );

            this.uniforms.push(`${name}: ${this.getType(type)},`);
            return this;
      }
      protected addVarying(name: string, type: number): this {
            this.varyings.push(`@location(${this.varyingBindingLocation}) ${name}: ${this.getType(type)},`);
            this.varyingBindingLocation++;
            this.fInput = `${this.VARYING_VARIABLE}: ${this.VARYING_STRUCT}`;
            return this;
      }
      protected addBinding(name: string, type: number): this{
            this.addUniformInfo( name, type, this.groupBindingLocation );
            this.bindings.push(`@group(0) @binding(${this.groupBindingLocation}) var ${name}: ${this.getType(type)};`);
            this.groupBindingLocation++;
            return this;
      }


      useDynamicElement(): this {
            this.positionTransformations.push(`${this.UNIFORMS_VARIABLE}.${UN.transformation}`);
            this.addUniform(UN.transformation, WebGPUShader.MAT4x4);
            return this;
      }
      usePerspective(): this {
            this.positionTransformations.push(`${this.UNIFORMS_VARIABLE}.${UN.perspective}`);
            this.addUniform(UN.perspective, WebGPUShader.MAT4x4);
            return this;
      }
      useAnimation2D(): this {

            if( this.varyings.join().indexOf('texture_coords') < 0 ){
                  console.warn('cannot use 2d animation in a non-textured element');
                  return this;
            }

            this
            .useTexture()
            .addUniform(UN.framePosition, WebGPUShader.VEC2);

            this.fCode.push(`
            ${this.VARYING_VARIABLE}.texture_coords.x += ${this.UNIFORMS_VARIABLE}.${UN.framePosition}.x;
            ${this.VARYING_VARIABLE}.texture_coords.y += ${this.UNIFORMS_VARIABLE}.${UN.framePosition}.y; 
            `);
            return this;
      }
      useTexture(): this {

            this
            .resetVariables()
            .addAttribute(AN.vertex, WebGPUShader.VEC3)
            .addAttribute(AN.textureCoordinates, WebGPUShader.VEC2)
            .addBinding('texture_sampler', WebGPUShader.SAMPLER)
            .addBinding('texture', WebGPUShader.TEXTURE2D)
            .addVarying('texture_coords', WebGPUShader.VEC2);

            this.vCode.push(`
            var out: ${this.VARYING_STRUCT};
            out.position = ${this.DEFAULT_VERTEX_RETURNED_VALUE};
            out.texture_coords = ${this.ATTRIBUTES_VARIABLE}.${AN.textureCoordinates};
            `);
            this.vertexReturnedValue = 'out';
            this.fragmentReturnedValue = `textureSample(texture, texture_sampler, ${this.VARYING_VARIABLE}.texture_coords)`
            return this;
      }
      useInterpolatedColor(): this {
            this
            .resetVariables()
            .addAttribute(AN.vertex, WebGPUShader.VEC3)
            .addAttribute(AN.color, WebGPUShader.VEC4)
            .addVarying('color', WebGPUShader.VEC4);
            
            this.vCode.push(`
                  var out: ${this.VARYING_STRUCT};
                  out.position = ${this.DEFAULT_VERTEX_RETURNED_VALUE};
                  out.color = ${this.ATTRIBUTES_VARIABLE}.${AN.color};
            `)
            this.vertexReturnedValue = 'out';
            this.fragmentReturnedValue = `${this.VARYING_VARIABLE}.color`
            return this;
      }
      useUniformColor(r: number, g: number, b: number, a: number = 1): this {

            this
            .resetVariables()
            .addAttribute(AN.vertex, WebGPUShader.VEC3);

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
            .addUniform(UN.bumpScale, WebGPUShader.FLOAT);
            this.vCode.push(`
                  var height = textureSampleLevel( displacement_map, texture_sampler, ${this.ATTRIBUTES_VARIABLE}.${AN.textureCoordinates}, 0.0 );
                  out.position.y += ${this.UNIFORMS_VARIABLE}.${UN.bumpScale} * height;
            `);
            
            return this;
      }
      override get(): Model.ProgramInfo {
            return {
                  vertex: this.getVertex(),
                  fragment: this.getFragment(),
                  attributes: this._attributesData,
                  attributeStride: this.attribOffset,
            }
      }
}
WebGPUShader.setTypes();

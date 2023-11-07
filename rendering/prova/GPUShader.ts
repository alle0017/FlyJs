import * as Model from './shaderModel.js';

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
      private readonly DEFAULT_VERTEX_RETURNED_VALUE: string = `${this.UNIFORMS_VARIABLE}.prospective * ${this.UNIFORMS_VARIABLE}.transformation * vec4f(${this.ATTRIBUTES_VARIABLE}.vertex_position, 1)`;

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


      protected getVertex(): string {
            const code = this.vCode.length? 
            this.vCode.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`): 
            '';
            return `
            ${this.getUniformsDefinition()}
            ${this.getVaryingsDefinition()}
            ${this.getAttributesDefinition()}
            ${this.bindings.reduce((prev, next)=> `${prev}\n${next}`)}
            @vertex
            fn vertex_shader(${this.vInput})->${
                  this.varyings.length ? 
                  this.VARYING_STRUCT:
                  '@builtin(position) vec4f'}{
                  ${code}
                  return ${this.vertexReturnedValue};
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
            this.vInput = `${this.ATTRIBUTES_VARIABLE}: ${this.ATTRIBUTES_STRUCT}`;
            this.attributes.push(`@location(${this.attributeBindingLocation}) ${name}: ${this.getType(type)},`);
            this.attributeBindingLocation++;
            return this;
      }
      protected addUniform(name: string, type: number): this {
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
            this.bindings.push(`@group(0) @binding(${this.groupBindingLocation}) var ${name}: ${this.getType(type)};`);
            this.groupBindingLocation++;
            return this;
      }



      useAnimation2D(): this {
            this
            .useTexture()
            .addUniform('frame_position', WebGPUShader.VEC2);

            this.fCode.push(`
            ${this.VARYING_VARIABLE}.texture.x += ${this.UNIFORMS_VARIABLE}.frame_position.x;
            ${this.VARYING_VARIABLE}.texture.y += ${this.UNIFORMS_VARIABLE}.frame_position.y; 
            `);
            return this;
      }

      useTexture(): this {
            this.resetVariables()
            .addAttribute('vertex_position', WebGPUShader.VEC3)
            .addAttribute('texture_coords', WebGPUShader.VEC2)
            .addBinding('texture_sampler', WebGPUShader.SAMPLER)
            .addBinding('texture', WebGPUShader.TEXTURE2D)
            .addUniform('transformation', WebGPUShader.MAT4x4)
            .addUniform('prospective', WebGPUShader.MAT4x4)
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
            this.resetVariables();
            this.addAttribute('vertex_position', WebGPUShader.VEC3);
            this.addUniform('transformation', WebGPUShader.MAT4x4);
            this.addUniform('prospective', WebGPUShader.MAT4x4);
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
            this.resetVariables()
            .addAttribute('vertex_position', WebGPUShader.VEC3)
            .addUniform('prospective', WebGPUShader.MAT4x4)
            .addUniform('transformation', WebGPUShader.MAT4x4);
            this.vertexReturnedValue = this.DEFAULT_VERTEX_RETURNED_VALUE;
            this.fragmentReturnedValue = `vec4f(${r}, ${g}, ${b}, ${a})`;
            return this;
      }
      useDisplacementMap(): this {
            this
            .useTexture()
            .addBinding('displacement_map', WebGPUShader.TEXTURE2D)
            .addUniform('bump_scale', WebGPUShader.FLOAT);
            this.vCode.push(`
                  var height = textureSampleLevel( displacement_map, texture_sampler, ${this.ATTRIBUTES_VARIABLE}.texture_coords, 0.0 );
                  out.position.y += ${this.UNIFORMS_VARIABLE}.bump_scale * height;
            `);
            
            return this;
      }
      get(): Model.ShaderCode {
            return {
                  vertex: this.getVertex(),
                  fragment: this.getFragment(),
            }
      }
}
WebGPUShader.setTypes();

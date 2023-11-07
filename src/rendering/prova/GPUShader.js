import * as Model from './shaderModel.js';
export class WebGPUShader extends Model.Shader {
    constructor() {
        super(...arguments);
        this.vInput = '';
        this.fInput = '';
        this.bindings = [];
        this.attributeBindingLocation = 0;
        this.varyingBindingLocation = 0;
        this.groupBindingLocation = 1;
        this.VARYING_STRUCT = 'Varyings';
        this.UNIFORMS_STRUCT = 'Uniforms';
        this.ATTRIBUTES_STRUCT = 'VertexInput';
        this.UNIFORMS_VARIABLE = 'uniforms';
        this.ATTRIBUTES_VARIABLE = 'vInput';
        this.VARYING_VARIABLE = 'fInput';
        this.DEFAULT_VERTEX_RETURNED_VALUE = `${this.UNIFORMS_VARIABLE}.prospective * ${this.UNIFORMS_VARIABLE}.transformation * vec4f(${this.ATTRIBUTES_VARIABLE}.vertex_position, 1)`;
    }
    static setTypes() {
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
    resetVariables() {
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
    getType(type) {
        if (!WebGPUShader.types[type])
            throw 'type not recognized ' + type;
        return WebGPUShader.types[type];
    }
    getUniformsDefinition() {
        if (this.uniforms.length <= 0)
            return '';
        return `
            struct ${this.UNIFORMS_STRUCT}{
                  ${this.uniforms.reduce((prev, next) => `${prev}\n\t\t\t\t\t${next}`)}
            }
            @group(0) @binding(0) var<uniform> ${this.UNIFORMS_VARIABLE}: ${this.UNIFORMS_STRUCT};
            `;
    }
    getVaryingsDefinition() {
        if (this.varyings.length <= 0)
            return '';
        return `
            struct ${this.VARYING_STRUCT}{
                  @builtin(position) position: vec4f,
                  ${this.varyings.reduce((prev, next) => `${prev}\n\t\t\t\t\t${next}`)}
            }
            `;
    }
    getAttributesDefinition() {
        if (this.attributes.length <= 0)
            return '';
        return `
            struct ${this.ATTRIBUTES_STRUCT}{
                  ${this.attributes.reduce((prev, next) => `${prev}\n\t\t\t\t\t${next}`)}
            }
            `;
    }
    getVertex() {
        const code = this.vCode.length ?
            this.vCode.reduce((prev, next) => `${prev}\n\t\t\t\t\t${next}`) :
            '';
        return `
            ${this.getUniformsDefinition()}
            ${this.getVaryingsDefinition()}
            ${this.getAttributesDefinition()}
            ${this.bindings.reduce((prev, next) => `${prev}\n${next}`)}
            @vertex
            fn vertex_shader(${this.vInput})->${this.varyings.length ?
            this.VARYING_STRUCT :
            '@builtin(position) vec4f'}{
                  ${code}
                  return ${this.vertexReturnedValue};
            }
            `;
    }
    getFragment() {
        const code = this.fCode.length ?
            this.fCode.reduce((prev, next) => `${prev}\n\t\t\t\t\t${next}`) :
            '';
        return `
            @fragment
            fn fragment_shader(${this.fInput})-> @location(0) vec4f {
                  ${code}
                  return ${this.fragmentReturnedValue};
            }
            `;
    }
    addAttribute(name, type) {
        this.vInput = `${this.ATTRIBUTES_VARIABLE}: ${this.ATTRIBUTES_STRUCT}`;
        this.attributes.push(`@location(${this.attributeBindingLocation}) ${name}: ${this.getType(type)},`);
        this.attributeBindingLocation++;
        return this;
    }
    addUniform(name, type) {
        this.uniforms.push(`${name}: ${this.getType(type)},`);
        return this;
    }
    addVarying(name, type) {
        this.varyings.push(`@location(${this.varyingBindingLocation}) ${name}: ${this.getType(type)},`);
        this.varyingBindingLocation++;
        this.fInput = `${this.VARYING_VARIABLE}: ${this.VARYING_STRUCT}`;
        return this;
    }
    addBinding(name, type) {
        this.bindings.push(`@group(0) @binding(${this.groupBindingLocation}) var ${name}: ${this.getType(type)};`);
        this.groupBindingLocation++;
        return this;
    }
    useAnimation2D() {
        this
            .useTexture()
            .addUniform('frame_position', WebGPUShader.VEC2);
        this.fCode.push(`
            ${this.VARYING_VARIABLE}.texture.x += ${this.UNIFORMS_VARIABLE}.frame_position.x;
            ${this.VARYING_VARIABLE}.texture.y += ${this.UNIFORMS_VARIABLE}.frame_position.y; 
            `);
        return this;
    }
    useTexture() {
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
        this.fragmentReturnedValue = `textureSample(texture, texture_sampler, ${this.VARYING_VARIABLE}.texture_coords)`;
        return this;
    }
    useInterpolatedColor() {
        this.resetVariables();
        this.addAttribute('vertex_position', WebGPUShader.VEC3);
        this.addUniform('transformation', WebGPUShader.MAT4x4);
        this.addUniform('prospective', WebGPUShader.MAT4x4);
        this.vCode.push(`
                  var out: ${this.VARYING_STRUCT};
                  out.position = ${this.DEFAULT_VERTEX_RETURNED_VALUE};
                  out.color = ${this.ATTRIBUTES_VARIABLE}.color;
            `);
        this.vertexReturnedValue = 'out';
        this.fragmentReturnedValue = `${this.VARYING_VARIABLE}.color`;
        return this;
    }
    useUniformColor(r, g, b, a = 1) {
        this.resetVariables()
            .addAttribute('vertex_position', WebGPUShader.VEC3)
            .addUniform('prospective', WebGPUShader.MAT4x4)
            .addUniform('transformation', WebGPUShader.MAT4x4);
        this.vertexReturnedValue = this.DEFAULT_VERTEX_RETURNED_VALUE;
        this.fragmentReturnedValue = `vec4f(${r}, ${g}, ${b}, ${a})`;
        return this;
    }
    useDisplacementMap() {
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
    get() {
        return {
            vertex: this.getVertex(),
            fragment: this.getFragment(),
        };
    }
}
WebGPUShader.setTypes();

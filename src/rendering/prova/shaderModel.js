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
export var AttributesName;
(function (AttributesName) {
    AttributesName["vertex"] = "vertex_position";
    AttributesName["color"] = "color";
    AttributesName["textureCoordinates"] = "texture_coords";
})(AttributesName || (AttributesName = {}));
export var UniformsName;
(function (UniformsName) {
    UniformsName["perspective"] = "perspective";
    UniformsName["transformation"] = "transformation";
    UniformsName["bumpScale"] = "bump_scale";
    UniformsName["framePosition"] = "frame_position";
})(UniformsName || (UniformsName = {}));
class Shader {
    get attributesData() {
        return this._attributesData;
    }
    set attributesData(data) { }
    get uniformsData() {
        return this._uniformsData;
    }
    set uniformsData(data) { }
    constructor() {
        this.varyings = [];
        this.attributes = [];
        this.uniforms = [];
        this.positionTransformations = [];
        this.vCode = [];
        this.fCode = [];
        this.fragmentReturnedValue = '';
        this.vertexReturnedValue = '';
        this._attributesData = new Map();
        this._uniformsData = new Map();
    }
}
Shader.FRAGMENT = 0;
Shader.VERTEX = 1;
Shader.MAT3x2 = 0;
Shader.MAT2x2 = 1;
Shader.MAT3x3 = 2;
Shader.MAT4x4 = 3;
Shader.VEC2 = 4;
Shader.VEC3 = 5;
Shader.VEC4 = 6;
Shader.INT = 10;
Shader.FLOAT = 7;
Shader.BOOL = 9;
Shader.TEXTURE2D = 8;
Shader.SAMPLER = 11;
Shader.types = [];
export { Shader };

import * as Model from './shaderModel.js';
import { AttributesName as AN, UniformsName as UN, BindingsName as BN } from './shaderModel.js';
export const UNIFORM = 'uniform';
class WebGPUShader extends Model.Shader {
    constructor() {
        super(...arguments);
        this.vInput = '';
        this.fInput = '';
        this.bindings = [];
        this.attributeBindingLocation = 0;
        this.varyingBindingLocation = 0;
        /**
        * first free location
         */
        this.groupBindingLocation = 0;
        this.uniformBindingLocation = -1;
        this.bindingsData = [];
        this.VARYING_STRUCT = 'Varyings';
        this.UNIFORMS_STRUCT = 'Uniforms';
        this.ATTRIBUTES_STRUCT = 'VertexInput';
        this.UNIFORMS_VARIABLE = 'uniforms';
        this.ATTRIBUTES_VARIABLE = 'vInput';
        this.VARYING_VARIABLE = 'fInput';
        this.DEFAULT_VERTEX_RETURNED_VALUE = `vec4f(${this.ATTRIBUTES_VARIABLE}.${AN.vertex}, 1)`;
        this.attribOffset = 0;
        this.uniformOffset = 0;
    }
    addAttributesInfo(name, type, bindingLocation) {
        const typeInfo = WebGPUShader.typeSize[type] ?
            WebGPUShader.typeSize[type] :
            { type: '', components: 0, size: 0 };
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
    addUniformInfo(name, type, bindingLocation) {
        const typeInfo = WebGPUShader.typeSize[type] ?
            WebGPUShader.typeSize[type] :
            { type: '', components: 0, size: 0 };
        if (bindingLocation === this.uniformBindingLocation) {
            typeInfo.type = UNIFORM;
            name = UNIFORM;
        }
        this.bindingsData[bindingLocation] = name;
        return {
            components: typeInfo.components,
            size: typeInfo.size
        };
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
        this.typeSize[this.VEC4] = { type: 'float32', components: 4, size: 4 };
        this.typeSize[this.VEC3] = { type: 'float32', components: 3, size: 4 };
        this.typeSize[this.VEC2] = { type: 'float32', components: 2, size: 4 };
        this.typeSize[this.INT] = { type: 'sint32', components: 1, size: 4 };
        this.typeSize[this.FLOAT] = { type: 'float32', components: 1, size: 4 };
        //uniforms => type is patched
        this.typeSize[this.MAT4x4] = { type: 'float32', components: 16, size: 4 };
        this.typeSize[this.MAT3x3] = { type: 'float32', components: 9, size: 4 };
        this.typeSize[this.MAT2x2] = { type: 'float32', components: 4, size: 4 };
        this.typeSize[this.MAT3x2] = { type: 'float32', components: 6, size: 4 };
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
        this.groupBindingLocation = 0;
        this.uniformBindingLocation = -1;
        this.uniformOffset = 0;
        this.attribOffset = 0;
        this.fragmentReturnedValue = '';
        this.vertexReturnedValue = '';
        this._attributesData.clear();
        this._uniformsData.clear();
        this.bindingsData = [];
        this._functions = '';
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
            @group(0) @binding(${this.uniformBindingLocation}) var<uniform> ${this.UNIFORMS_VARIABLE}: ${this.UNIFORMS_STRUCT};
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
    getPositionTransformations() {
        const transformations = this.positionTransformations.length ?
            this.positionTransformations.reduce((prev, next) => `${prev} * ${next}`) + ' *' : '';
        const code = this.varyings.length ?
            `
                  ${this.vertexReturnedValue}.position = ${transformations} ${this.vertexReturnedValue}.position;
                  return ${this.vertexReturnedValue};
                  ` :
            `return ${transformations} ${this.vertexReturnedValue};`;
        return code;
    }
    getVertex() {
        const code = this.vCode.length ?
            this.vCode.reduce((prev, next) => `${prev}\n\t\t\t\t\t${next}`) :
            '';
        return `
            ${this._functions}
            ${this.getUniformsDefinition()}
            ${this.getVaryingsDefinition()}
            ${this.getAttributesDefinition()}
            ${this.bindings.length > 0 ? this.bindings.reduce((prev, next) => `${prev}\n${next}`) : ''}
            @vertex
            fn vertex_shader(${this.vInput})->${this.varyings.length ?
            this.VARYING_STRUCT :
            '@builtin(position) vec4f'}{
                  ${code}
                  ${this.getPositionTransformations()}
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
        this.addAttributesInfo(name, type, this.attributeBindingLocation);
        this.vInput = `${this.ATTRIBUTES_VARIABLE}: ${this.ATTRIBUTES_STRUCT}`;
        this.attributes.push(`@location(${this.attributeBindingLocation}) ${name}: ${this.getType(type)},`);
        this.attributeBindingLocation++;
        return this;
    }
    addUniform(name, type) {
        if (this.uniformBindingLocation < 0) {
            this.uniformBindingLocation = this.groupBindingLocation;
            this.groupBindingLocation++;
        }
        const data = this.addUniformInfo(name, type, this.uniformBindingLocation);
        this.uniformOffset += data.components * data.size;
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
        this.addUniformInfo(name, type, this.groupBindingLocation);
        this.bindings.push(`@group(0) @binding(${this.groupBindingLocation}) var ${name}: ${this.getType(type)};`);
        this.groupBindingLocation++;
        return this;
    }
    useDynamicElement() {
        this.positionTransformations.push(`${this.UNIFORMS_VARIABLE}.${UN.transformation}`);
        this.addUniform(UN.transformation, WebGPUShader.MAT4x4);
        return this;
    }
    usePerspective() {
        this.positionTransformations.push(`${this.UNIFORMS_VARIABLE}.${UN.perspective}`);
        this.addUniform(UN.perspective, WebGPUShader.MAT4x4);
        return this;
    }
    useAnimation2D() {
        if (this.varyings.join().indexOf('texture_coords') < 0) {
            console.warn('cannot use 2d animation in a non-textured element');
            return this;
        }
        this
            .addUniform(UN.framePosition, WebGPUShader.VEC4);
        this.vCode.push(`out.texture_coords += ${this.UNIFORMS_VARIABLE}.${UN.framePosition}.xy;`);
        return this;
    }
    useTexture() {
        this
            .resetVariables()
            .addAttribute(AN.vertex, WebGPUShader.VEC3)
            .addAttribute(AN.textureCoordinates, WebGPUShader.VEC2)
            .addBinding(BN.texture, WebGPUShader.TEXTURE2D)
            .addBinding(BN.textureSampler, WebGPUShader.SAMPLER)
            .addVarying('texture_coords', WebGPUShader.VEC2);
        this.vCode.push(`
            var out: ${this.VARYING_STRUCT};
            out.position = ${this.DEFAULT_VERTEX_RETURNED_VALUE};
            out.texture_coords = ${this.ATTRIBUTES_VARIABLE}.${AN.textureCoordinates};
            `);
        this.vertexReturnedValue = 'out';
        this.fragmentReturnedValue = `textureSample(${BN.texture}, ${BN.textureSampler}, ${this.VARYING_VARIABLE}.texture_coords)`;
        return this;
    }
    useInterpolatedColor() {
        this
            .resetVariables()
            .addAttribute(AN.vertex, WebGPUShader.VEC3)
            .addAttribute(AN.color, WebGPUShader.VEC4)
            .addVarying('color', WebGPUShader.VEC4);
        this.vCode.push(`
                  var out: ${this.VARYING_STRUCT};
                  out.position = ${this.DEFAULT_VERTEX_RETURNED_VALUE};
                  out.color = ${this.ATTRIBUTES_VARIABLE}.${AN.color};
            `);
        this.vertexReturnedValue = 'out';
        this.fragmentReturnedValue = `${this.VARYING_VARIABLE}.color`;
        return this;
    }
    useUniformColor(r, g, b, a = 1) {
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
    useDisplacementMap() {
        if (this.attributes.join().indexOf('texture_coords') < 0) {
            console.warn('cannot use displacement map in a non-textured element');
            return this;
        }
        this
            .addBinding(BN.displacementMap, WebGPUShader.TEXTURE2D)
            .addUniform(UN.bumpScale, WebGPUShader.FLOAT);
        this.vCode.push(`
                  var height = textureSampleLevel( ${BN.displacementMap}, ${BN.textureSampler}, ${this.ATTRIBUTES_VARIABLE}.${AN.textureCoordinates}, 0.0 );
                  out.position.y += ${this.UNIFORMS_VARIABLE}.${UN.bumpScale} * height;
            `);
        return this;
    }
    //TODO check if 4 is correct
    getSkinningFunction() {
        return /* wgsl */ `
            fn skinning( indices: vec4f, weights: vec4f ) -> mat4x4f {
                  var m: mat4x4f = mat4x4f(
                        vec4f(0, 0, 0, 0),
                        vec4f(0, 0, 0, 0),
                        vec4f(0, 0, 0, 0),
                        vec4f(0, 0, 0, 0)
                  );
                  for( var i = 0; i < 4; i++ ){
                        m += bones[i32(indices[i])]*weights[i];
                  }
                  return m;
            }
            `;
    }
    useSkeletalAnimation(bones) {
        const SKINNING_MAT = 'skinning_mat';
        this._functions += this.getSkinningFunction();
        this.bindingsData[this.groupBindingLocation] = BN.bones;
        this.bindings.push(`@group(0) @binding(${this.groupBindingLocation}) var<uniform> ${BN.bones}: array<mat4x4f,${bones}>;`);
        this.groupBindingLocation++;
        this
            .addAttribute(AN.skIndices, WebGPUShader.VEC4)
            .addAttribute(AN.skWeights, WebGPUShader.VEC4)
            .vCode.push(/* wgsl */ `
             var ${SKINNING_MAT} = skinning( ${this.ATTRIBUTES_VARIABLE}.${AN.skIndices}, ${this.ATTRIBUTES_VARIABLE}.${AN.skWeights} );
            `);
        this.positionTransformations.push(SKINNING_MAT);
        return this;
    }
    get() {
        return {
            vertex: this.getVertex(),
            fragment: this.getFragment(),
            attributes: this._attributesData,
            uniforms: this._uniformsData,
            bindings: this.bindingsData,
            attributeStride: this.attribOffset,
            uniformStride: this.uniformOffset,
            uniformsName: this.uniforms.map((val) => val.substring(0, val.indexOf(':')))
        };
    }
}
WebGPUShader.typeSize = [];
export { WebGPUShader };
WebGPUShader.setTypes();

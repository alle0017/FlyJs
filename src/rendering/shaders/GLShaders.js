import * as Model from './shaderModel.js';
import { AttributesName as AN, UniformsName as UN, BindingsName as BN } from './shaderModel.js';
class WebGLShader extends Model.Shader {
    constructor() {
        super(...arguments);
        this.fragmentUniforms = [];
    }
    static setTypes() {
        this.types[WebGLShader.MAT4x4] = 'mat4';
        this.types[WebGLShader.MAT3x3] = 'mat3';
        this.types[WebGLShader.MAT2x2] = 'mat2';
        this.types[WebGLShader.MAT3x2] = 'mat3x2';
        this.types[WebGLShader.VEC4] = 'vec4';
        this.types[WebGLShader.VEC3] = 'vec3';
        this.types[WebGLShader.VEC2] = 'vec2';
        this.types[WebGLShader.TEXTURE2D] = 'sampler2D';
        this.types[WebGLShader.INT] = 'int';
        this.types[WebGLShader.FLOAT] = 'float';
        this.types[WebGLShader.BOOL] = 'bool';
        this.typeSize[this.VEC4] = { type: 'vec4', components: 4, size: 4 };
        this.typeSize[this.VEC3] = { type: 'vec3', components: 3, size: 4 };
        this.typeSize[this.VEC2] = { type: 'vec2', components: 2, size: 4 };
        this.typeSize[this.INT] = { type: 'int', components: 1, size: 4 };
        this.typeSize[this.FLOAT] = { type: 'float', components: 1, size: 4 };
        //uniforms => type is patched
        this.typeSize[this.MAT4x4] = { type: 'mat4', components: 16, size: 4 };
        this.typeSize[this.MAT3x3] = { type: 'mat3', components: 9, size: 4 };
        this.typeSize[this.MAT2x2] = { type: 'mat2', components: 4, size: 4 };
        this.typeSize[this.MAT3x2] = { type: 'mat3x2', components: 6, size: 4 };
    }
    getType(type) {
        if (!WebGLShader.types[type])
            throw 'type not recognized ' + type;
        return WebGLShader.types[type];
    }
    resetVariables() {
        this.uniforms = [];
        this.varyings = [];
        this.attributes = [];
        this.fragmentUniforms = [];
        this.positionTransformations = [];
        this.vCode = [];
        this.fCode = [];
        this.fragmentReturnedValue = '';
        this.vertexReturnedValue = '';
        this._attributesData.clear();
        this._uniformsData.clear();
        return this;
    }
    addAttributesData(name, type) {
        const typeInfo = WebGLShader.typeSize[type];
        if (!type)
            return;
        this._attributesData.set(name, {
            dataType: typeInfo.type,
            shaderLocation: 0,
            components: typeInfo.components,
            offset: 0,
            name,
            size: typeInfo.size
        });
    }
    addUniformsData(name, type) {
        const typeInfo = WebGLShader.typeSize[type];
        if (!type)
            return;
        this._uniformsData.set(name, {
            dataType: typeInfo.type,
            shaderLocation: 0,
            components: typeInfo.components,
            offset: 0,
            name,
            size: typeInfo.size
        });
    }
    getFragment() {
        const code = this.fCode.length ?
            this.fCode.reduce((prev, next) => `${prev}\n\t\t\t\t\t${next}`) :
            '';
        return `
            precision mediump float;

            ${this.getUniformsDefinition(WebGLShader.FRAGMENT)}
            ${this.getVaryingsDefinition()}

            void main() {
                  ${code}
                  gl_FragColor = ${this.fragmentReturnedValue};
            }
            `;
    }
    getVertex() {
        const code = this.vCode.length ?
            this.vCode.reduce((prev, next) => `${prev}\n\t\t\t\t\t${next}`) :
            '';
        return `
            ${this.getAttributesDefinition()}

            ${this.getUniformsDefinition(WebGLShader.VERTEX)}

            ${this.getVaryingsDefinition()}

            void main() {
                  ${code}
                  gl_Position = ${this.getPositionTransformations()} ${this.vertexReturnedValue};
            }
            `;
    }
    getUniformsDefinition(type) {
        if (type === WebGLShader.FRAGMENT) {
            return this.fragmentUniforms.length ?
                this.fragmentUniforms.reduce((prev, next) => `${prev}\n${next}`)
                : '';
        }
        return this.uniforms.length ?
            this.uniforms.reduce((prev, next) => `${prev}\n${next}`)
            : '';
    }
    getVaryingsDefinition() {
        return this.varyings.length ?
            this.varyings.reduce((prev, next) => `${prev}\n${next}`)
            : '';
    }
    getAttributesDefinition() {
        return this.attributes.length ?
            this.attributes.reduce((prev, next) => `${prev}\n${next}`)
            : '';
    }
    getPositionTransformations() {
        if (this.positionTransformations.length)
            return this.positionTransformations.reduce((prev, next) => `${prev} * ${next}`) + ' *';
        return '';
    }
    addAttribute(name, type) {
        this.addAttributesData(name, type);
        this.attributes.push(`attribute ${this.getType(type)} ${name};`);
        return this;
    }
    addUniform(name, type, shaderType) {
        if (shaderType === WebGLShader.FRAGMENT) {
            this.fragmentUniforms.push(`uniform ${this.getType(type)} ${name};`);
        }
        else {
            this.uniforms.push(`uniform ${this.getType(type)} ${name};`);
        }
        this.addUniformsData(name, type);
        return this;
    }
    addVarying(name, type) {
        this.varyings.push(`varying ${this.getType(type)} ${name};`);
        return this;
    }
    usePerspective() {
        this.positionTransformations.push(UN.perspective);
        this.addUniform(UN.perspective, WebGLShader.MAT4x4, WebGLShader.VERTEX);
        return this;
    }
    useDynamicElement() {
        this.positionTransformations.push(UN.transformation);
        this.addUniform(UN.transformation, WebGLShader.MAT4x4, WebGLShader.VERTEX);
        return this;
    }
    useAnimation2D() {
        if (this.attributes.join().indexOf(AN.textureCoordinates) < 0) {
            console.warn('cannot use 2d animations in a non-textured element');
            return this;
        }
        this.addUniform(UN.framePosition, WebGLShader.VEC2, WebGLShader.VERTEX);
        this.vCode.push(`
                  texture_coords.x += ${UN.framePosition}.x;
                  texture_coords.y += ${UN.framePosition}.y;
            `);
        return this;
    }
    useTexture() {
        this
            .resetVariables()
            .addUniform(BN.texture, WebGLShader.TEXTURE2D, WebGLShader.FRAGMENT)
            .addAttribute(AN.vertex, WebGLShader.VEC3)
            .addAttribute(AN.textureCoordinates, WebGLShader.VEC4)
            .addVarying('v_text_coords', WebGLShader.VEC4);
        this.vCode.push(`
                  v_text_coords = ${AN.textureCoordinates};
            `);
        this.vertexReturnedValue = `vec4(${AN.vertex}, 1)`;
        this.fragmentReturnedValue = `texture2D( ${BN.texture}, v_text_coords )`;
        return this;
    }
    useInterpolatedColor() {
        this
            .resetVariables()
            .addAttribute(AN.vertex, WebGLShader.VEC3)
            .addAttribute(AN.color, WebGLShader.VEC4)
            .addVarying('v_color', WebGLShader.VEC4);
        this.vCode.push(`
                  v_color = ${AN.color};
            `);
        this.vertexReturnedValue = `vec4(${AN.vertex}, 1)`;
        this.fragmentReturnedValue = `v_color`;
        return this;
    }
    useUniformColor(r, g, b, a = 1) {
        this
            .resetVariables()
            .addAttribute(AN.vertex, WebGLShader.VEC3);
        this.vertexReturnedValue = `vec4(${AN.vertex}, 1)`;
        this.fragmentReturnedValue = `vec4(${r}, ${g}, ${b}, ${a})`;
        return this;
    }
    useDisplacementMap() {
        if (this.attributes.join().indexOf(AN.textureCoordinates) < 0) {
            console.warn('cannot use displacement map in a non-textured element');
            return this;
        }
        this
            .addUniform(BN.displacementMap, WebGLShader.TEXTURE2D, WebGLShader.VERTEX)
            .addUniform(UN.bumpScale, WebGLShader.FLOAT, WebGLShader.VERTEX);
        this.vCode.push(`
                  float height = texture2D( ${BN.displacementMap}, ${AN.textureCoordinates} );
                  position.y += height * ${UN.bumpScale}; 
            `);
        return this;
    }
    get() {
        return {
            attributes: this._attributesData,
            uniforms: this._uniformsData,
            uniformsName: [],
            attributeStride: 0,
            uniformStride: 0,
            vertex: this.getVertex(),
            fragment: this.getFragment(),
        };
    }
}
WebGLShader.typeSize = [];
export { WebGLShader };
WebGLShader.setTypes();

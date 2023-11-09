import * as Model from './shaderModel.js';
export class WebGLShader extends Model.Shader {
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
        return this;
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
        return this;
    }
    addVarying(name, type) {
        this.varyings.push(`varying ${this.getType(type)} ${name};`);
        return this;
    }
    usePerspective() {
        this.positionTransformations.push('perspective');
        this.addUniform('perspective', WebGLShader.MAT4x4, WebGLShader.VERTEX);
        return this;
    }
    useDynamicElement() {
        this.positionTransformations.push('transformation');
        this.addUniform('transformation', WebGLShader.MAT4x4, WebGLShader.VERTEX);
        return this;
    }
    useAnimation2D() {
        if (this.attributes.join().indexOf('texture_coords') < 0) {
            console.warn('cannot use 2d animations in a non-textured element');
            return this;
        }
        this.addUniform('animation_frame', WebGLShader.VEC2, WebGLShader.VERTEX);
        this.vCode.push(`
                  texture_coords.x += animation_frame.x;
                  texture_coords.y += animation_frame.y;
            `);
        return this;
    }
    useTexture() {
        this
            .resetVariables()
            .addUniform('texture', WebGLShader.TEXTURE2D, WebGLShader.FRAGMENT)
            .addAttribute('position', WebGLShader.VEC3)
            .addAttribute('texture_coords', WebGLShader.VEC4)
            .addVarying('v_text_coords', WebGLShader.VEC4);
        this.vCode.push(`
                  v_text_coords = texture_coords;
            `);
        this.vertexReturnedValue = 'vec4(position, 1)';
        this.fragmentReturnedValue = `texture2D( texture, v_text_coords )`;
        return this;
    }
    useInterpolatedColor() {
        this
            .resetVariables()
            .addAttribute('position', WebGLShader.VEC3)
            .addAttribute('color', WebGLShader.VEC4)
            .addVarying('v_color', WebGLShader.VEC4);
        this.vCode.push(`
                  v_color = color;
            `);
        this.vertexReturnedValue = 'vec4(position, 1)';
        this.fragmentReturnedValue = `v_color`;
        return this;
    }
    useUniformColor(r, g, b, a = 1) {
        this
            .resetVariables()
            .addAttribute('position', WebGLShader.VEC3);
        this.vertexReturnedValue = 'vec4(position, 1)';
        this.fragmentReturnedValue = `vec4(${r}, ${g}, ${b}, ${a})`;
        return this;
    }
    useDisplacementMap() {
        if (this.attributes.join().indexOf('texture_coords') < 0) {
            console.warn('cannot use displacement map in a non-textured element');
            return this;
        }
        this
            .addUniform('displacement_map', WebGLShader.TEXTURE2D, WebGLShader.VERTEX)
            .addUniform('bump_scale', WebGLShader.FLOAT, WebGLShader.VERTEX);
        this.vCode.push(`
                  float height = texture2D( displacement_map, texture_coords );
                  position.y += height * bump_scale; 
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
WebGLShader.setTypes();

class WebGLShaders {
    constructor(shaderType) {
        this.shaderType = shaderType;
        this.precision = WebGLShaders.MEDIUMP;
        this.uniforms = [];
        this.varyings = [];
        this.attributes = [];
        this.code = [];
        this.returnedValue = 'vec4(0, 0, 0, 1)';
        this.attributeNames = [];
        this.varyingNames = [];
        this.uniformNames = [];
    }
    get() {
        switch (this.shaderType) {
            case WebGLShaders.VERTEX: {
                return `
                        ${this.attributes.join('')}

                        ${this.varyings.join('')}

                        ${this.uniforms.join('')}

                        void main() {
                              ${this.code.join('')}
                              gl_Position = ${this.returnedValue};
                        }
                        `;
            }
            case WebGLShaders.FRAGMENT: {
                return `
                        precision ${this.precision} float;

                        ${this.varyings.join('')}

                        ${this.uniforms.join('')}

                        void main() {
                              ${this.code.join('')}
                              gl_FragColor = ${this.returnedValue};
                        }
                        `;
            }
            default: {
                return ``;
            }
        }
    }
    addUniform(name, type) {
        const typeString = this.getType(type);
        this.uniformNames.push(name);
        this.uniforms.push(`uniform ${typeString} ${name};`);
        return this;
    }
    addVarying(name, type) {
        const typeString = this.getType(type);
        this.varyingNames.push(name);
        this.varyings.push(`varying ${typeString} ${name};`);
        return this;
    }
    addAttribute(name, type) {
        if (this.shaderType !== WebGLShaders.VERTEX)
            return this;
        const typeString = this.getType(type);
        this.attributeNames.push(name);
        this.attributes.push(`attribute ${typeString} ${name};`);
        return this;
    }
    addCode(code) {
        this.code.push(code);
        return this;
    }
    setReturnedValue(value) {
        this.returnedValue = value;
        return this;
    }
    setPrecision(precision) {
        if (this.shaderType !== WebGLShaders.FRAGMENT &&
            precision !== WebGLShaders.HIGHP &&
            precision !== WebGLShaders.MEDIUMP &&
            precision !== WebGLShaders.LOWP)
            return this;
        this.precision = precision;
        return this;
    }
    getType(type) {
        switch (type) {
            case WebGLShaders.MAT4: {
                return 'mat4';
            }
            case WebGLShaders.MAT3: {
                return 'mat3';
            }
            case WebGLShaders.VEC4: {
                return 'vec4';
            }
            case WebGLShaders.VEC3: {
                return 'vec3';
            }
            case WebGLShaders.VEC2: {
                return 'vec2';
            }
            case WebGLShaders.SAMPLER2D: {
                return 'sampler2D';
            }
            case WebGLShaders.FLOAT: {
                return 'float';
            }
            default: {
                console.error('unsupported webGL type: ' + type);
            }
        }
    }
    setBasicVertexShader() {
        if (this.shaderType !== WebGLShaders.VERTEX)
            return this;
        return this
            .addAttribute(WebGLShaders.A_POSITION, WebGLShaders.VEC3)
            .addUniform(WebGLShaders.U_TRANSFORM, WebGLShaders.MAT4)
            .addUniform(WebGLShaders.U_PROSPECTIVE, WebGLShaders.MAT4)
            .setReturnedValue(`${WebGLShaders.U_PROSPECTIVE} * ${WebGLShaders.U_TRANSFORM} * vec4(${WebGLShaders.A_POSITION}, 1.0)`);
    }
    setVertexShaderForTexture() {
        if (this.shaderType !== WebGLShaders.VERTEX)
            return this;
        return this
            .setBasicVertexShader()
            .addAttribute(WebGLShaders.A_TEXTURE_COORDINATES, WebGLShaders.VEC2)
            .addVarying(WebGLShaders.V_TEXTURE_COORDINATES, WebGLShaders.VEC2)
            .addCode(`${WebGLShaders.V_TEXTURE_COORDINATES} = ${WebGLShaders.A_TEXTURE_COORDINATES};`);
    }
    setVertexShaderForUniformColor() {
        if (this.shaderType !== WebGLShaders.VERTEX)
            return this;
        return this
            .setBasicVertexShader()
            .addAttribute(WebGLShaders.A_COLOR, WebGLShaders.VEC4)
            .addVarying(WebGLShaders.V_COLOR, WebGLShaders.VEC4)
            .addCode(`${WebGLShaders.V_COLOR} = ${WebGLShaders.A_COLOR};`);
    }
    setFragmentShaderForTexture() {
        if (this.shaderType !== WebGLShaders.FRAGMENT)
            return this;
        return this
            .addVarying(WebGLShaders.V_TEXTURE_COORDINATES, WebGLShaders.VEC2)
            .addUniform(WebGLShaders.U_TEXTURE, WebGLShaders.SAMPLER2D)
            .setReturnedValue(`texture2D(${WebGLShaders.U_TEXTURE}, ${WebGLShaders.V_TEXTURE_COORDINATES})`);
    }
    setFragmentShaderForUniformColor() {
        if (this.shaderType !== WebGLShaders.FRAGMENT)
            return this;
        return this
            .addVarying(WebGLShaders.V_COLOR, WebGLShaders.VEC4)
            .setReturnedValue(WebGLShaders.V_COLOR);
    }
    setFragmentShaderForAnimation() {
        if (this.shaderType !== WebGLShaders.FRAGMENT)
            return this;
        return this
            .addUniform(WebGLShaders.U_ANIMATION, WebGLShaders.VEC2)
            .addCode(`vec2 texture_coord = 
                  vec2(${WebGLShaders.U_ANIMATION}.x + ${WebGLShaders.V_TEXTURE_COORDINATES}.x, 
                  ${WebGLShaders.U_ANIMATION}.y + ${WebGLShaders.V_TEXTURE_COORDINATES}.y);`)
            .setReturnedValue(`texture2D(${WebGLShaders.U_TEXTURE}, texture_coord)`);
    }
}
//shader type
WebGLShaders.FRAGMENT = 2;
WebGLShaders.VERTEX = 1;
// uniforms type
WebGLShaders.MAT3 = 11;
WebGLShaders.MAT4 = 5;
WebGLShaders.VEC2 = 9;
WebGLShaders.VEC3 = 8;
WebGLShaders.VEC4 = 6;
WebGLShaders.FLOAT = 7;
WebGLShaders.SAMPLER2D = 10;
//precision
WebGLShaders.MEDIUMP = 'mediump';
WebGLShaders.HIGHP = 'highp';
WebGLShaders.LOWP = 'lowp';
//default names for variables
WebGLShaders.A_TEXTURE_COORDINATES = 'a_text_coord';
WebGLShaders.A_COLOR = 'a_color';
WebGLShaders.A_POSITION = 'a_position';
WebGLShaders.V_TEXTURE_COORDINATES = 'v_text_coord';
WebGLShaders.V_COLOR = 'v_color';
WebGLShaders.U_TEXTURE = 'u_texture';
WebGLShaders.U_TRANSFORM = 'u_transform';
WebGLShaders.U_PROSPECTIVE = 'u_prospective';
WebGLShaders.U_ANIMATION = 'u_animation';
export { WebGLShaders };

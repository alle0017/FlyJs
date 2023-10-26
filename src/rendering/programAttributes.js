import { WebGLShaders } from "./shaderGL.js";
/**
 * Class representing the attributes of a WebGL shader program.
 */
class ProgramAttributes {
    /**
    * Constructor for the ProgramAttributes class.
    * @param {GLRenderer} renderer - The WebGL renderer.
    * @param {DrawableElementAttributes} opt - Attributes for the drawable element.
    */
    constructor(renderer, opt) {
        this.renderer = renderer;
        // Shader instances
        this.vertexShader = new WebGLShaders(WebGLShaders.VERTEX);
        this.fragmentShader = new WebGLShaders(WebGLShaders.FRAGMENT);
        // Data for attributes and uniforms
        this.attributes = [];
        this.uniforms = [];
        // Index for animation, transform, and prospective uniforms
        this.animation = -1;
        this.transform = 0;
        this.prospective = 1;
        // Initialize shader source code and attributes
        this.getProgramAttributes(opt);
        this.fragment = this.fragmentShader.get();
        this.vertex = this.vertexShader.get();
    }
    // Private method to create a uniform
    createUniform(name, type, value = 0, transpose = false) {
        return {
            name: name,
            transpose: transpose,
            value: value,
            location: 0,
            type: type || (typeof value == 'number' ? ProgramAttributes.FLOAT : ProgramAttributes.MAT4),
        };
    }
    // Private method to set up animation attributes
    setAnimationAttributes(opt) {
        if (!opt.animate)
            return;
        this.fragmentShader.setFragmentShaderForAnimation();
        this.uniforms.push(this.createUniform(WebGLShaders.U_ANIMATION, ProgramAttributes.VEC2));
        this.animation = this.uniforms.length - 1;
    }
    // Private method to set up image attributes
    setImageAttributes(opt) {
        if (!opt.image || !opt.textureCoords)
            return;
        this.vertexShader.setVertexShaderForTexture();
        this.fragmentShader.setFragmentShaderForTexture();
        this.attributes.push({ name: WebGLShaders.A_TEXTURE_COORDINATES, value: opt.textureCoords, dim: 2 });
        this.uniforms.push(this.createUniform(WebGLShaders.U_TEXTURE, ProgramAttributes.TEXTURE));
        this.renderer.renderer.createTexture(opt.image);
        this.setAnimationAttributes(opt);
    }
    // Private method to set up uniform color attributes
    setUniformColorAttributes(opt) {
        if (!opt.color)
            return;
        this.vertexShader.setVertexShaderForUniformColor();
        this.fragmentShader.setFragmentShaderForUniformColor();
        this.attributes.push({ name: WebGLShaders.A_COLOR, value: opt.color, dim: 4 });
    }
    // Private method to gather attributes and uniforms based on drawable element attributes
    getProgramAttributes(opt) {
        this.attributes.push({ name: WebGLShaders.A_POSITION, value: opt.vertices, dim: 3 });
        this.uniforms.push(this.createUniform(WebGLShaders.U_TRANSFORM, ProgramAttributes.MAT4), this.createUniform(WebGLShaders.U_PROSPECTIVE, ProgramAttributes.MAT4));
        this.setImageAttributes(opt);
        this.setUniformColorAttributes(opt);
    }
}
// Shader type constants
ProgramAttributes.MAT4 = 1;
ProgramAttributes.TEXTURE = 2;
ProgramAttributes.FLOAT = 3;
ProgramAttributes.VEC4 = 4;
ProgramAttributes.MAT3 = 5;
ProgramAttributes.VEC2 = 6;
export { ProgramAttributes };

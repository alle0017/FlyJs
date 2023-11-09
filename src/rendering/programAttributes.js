import { WebGLShaders } from './shaderGL.js';
export class ProgramAttributes {
    constructor(renderer, opt) {
        this.renderer = renderer;
        // Shader instances
        this.vertexShader = new WebGLShaders(WebGLShaders.VERTEX);
        this.fragmentShader = new WebGLShaders(WebGLShaders.FRAGMENT);
        // Shader source code
        this.fragment = '';
        this.vertex = '';
        // Data for attributes and uniforms
        this.attributes = [];
        this.uniforms = [];
        // Index for animation, transform, and perspective uniforms
        this.animation = -1;
        this.transform = 0;
        this.perspective = 1;
        this.getProgramAttributes(opt);
        this.fragment = this.fragmentShader.get();
        this.vertex = this.vertexShader.get();
    }
    addAttribute(opt) {
        this.attributes.push(this.renderer.createBufferData(opt));
    }
    // Private method to set up animation attributes
    setAnimationAttributes(opt) {
        if (!opt.animate)
            return;
        this.fragmentShader.setFragmentShaderForAnimation();
        this.uniforms.push(this.renderer.createUniform(WebGLShaders.U_ANIMATION, this.renderer.VEC2));
        this.animation = this.uniforms.length - 1;
    }
    // Private method to set up image attributes
    setImageAttributes(opt) {
        if (!opt.image || !opt.textureCoords)
            return;
        this.vertexShader.setVertexShaderForTexture();
        this.fragmentShader.setFragmentShaderForTexture();
        this.addAttribute({
            attributeName: WebGLShaders.A_TEXTURE_COORDINATES,
            data: new Float32Array(opt.textureCoords),
            numberOfComponents: 2
        });
        this.uniforms.push(this.renderer.createUniform(WebGLShaders.U_TEXTURE, this.renderer.TEXTURE));
        this.renderer.createTexture(opt.image);
        this.setAnimationAttributes(opt);
    }
    // Private method to set up uniform color attributes
    setUniformColorAttributes(opt) {
        if (!opt.color)
            return;
        this.vertexShader.setVertexShaderForUniformColor();
        this.fragmentShader.setFragmentShaderForUniformColor();
        this.addAttribute({
            attributeName: WebGLShaders.A_COLOR,
            data: new Float32Array(opt.color),
            numberOfComponents: 4
        });
    }
    // Private method to gather attributes and uniforms based on drawable element attributes
    getProgramAttributes(opt) {
        this.addAttribute({
            attributeName: WebGLShaders.A_POSITION,
            data: new Float32Array(opt.vertices),
            numberOfComponents: 3
        });
        this.uniforms.push(this.renderer.createUniform(WebGLShaders.U_TRANSFORM, this.renderer.MAT4), this.renderer.createUniform(WebGLShaders.U_perspective, this.renderer.MAT4));
        this.setImageAttributes(opt);
        this.setUniformColorAttributes(opt);
    }
    setMatrices(transform, perspective, animationVector) {
        this.uniforms[this.transform].value = transform;
        this.uniforms[this.perspective].value = perspective;
        if (this.animation >= 0) {
            this.uniforms[this.animation].value = animationVector || [0, 0];
        }
    }
}

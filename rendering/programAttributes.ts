import { DrawableElementAttributes } from "./generics.js";
import { WebGLShaders } from "./shaderGL.js";
import { GLRenderer } from "./renderer.js";

/**
 * Represents a uniform in a WebGL shader program.
 */
type Uniform = {
    location: WebGLUniformLocation;
    value: number | Iterable<number>;
    transpose: boolean;
    name: string;
    type: number;
};

/**
 * Represents data for an attribute in a WebGL shader program.
 */
type AttributesData = {
    name: string;
    value: number[];
    dim: number;
};

/**
 * Class representing the attributes of a WebGL shader program.
 */
export class ProgramAttributes {

      // Shader type constants
      static readonly MAT4 = 1;
      static readonly TEXTURE = 2;
      static readonly FLOAT = 3;
      static readonly VEC4 = 4;
      static readonly MAT3 = 5;
      static readonly VEC2 = 6;

      // Shader instances
      private vertexShader = new WebGLShaders(WebGLShaders.VERTEX);
      private fragmentShader = new WebGLShaders(WebGLShaders.FRAGMENT);

      // Shader source code
      fragment: string;
      vertex: string;

      // Data for attributes and uniforms
      attributes: AttributesData[] = [];
      uniforms: Uniform[] = [];

      // Index for animation, transform, and prospective uniforms
      animation = -1;
      transform = 0;
      prospective = 1;

      /**
      * Constructor for the ProgramAttributes class.
      * @param {GLRenderer} renderer - The WebGL renderer.
      * @param {DrawableElementAttributes} opt - Attributes for the drawable element.
      */
      constructor(private renderer: GLRenderer, opt: DrawableElementAttributes) {
            // Initialize shader source code and attributes
            this.getProgramAttributes(opt);
            this.fragment = this.fragmentShader.get();
            this.vertex = this.vertexShader.get();
      }

      // Private method to create a uniform
      private createUniform(name: string, type?: number, value: number | Iterable<number> = 0, transpose: boolean = false): Uniform {
            return {
                  name: name,
                  transpose: transpose,
                  value: value,
                  location: 0,
                  type: type || (typeof value == 'number' ? ProgramAttributes.FLOAT : ProgramAttributes.MAT4),
            };
      }

      // Private method to set up animation attributes
      private setAnimationAttributes(opt: DrawableElementAttributes): void {
            if (!opt.animate) return;
            this.fragmentShader.setFragmentShaderForAnimation();
            this.uniforms.push(
                  this.createUniform(WebGLShaders.U_ANIMATION, ProgramAttributes.VEC2)
            );
            this.animation = this.uniforms.length - 1;
      }

      // Private method to set up image attributes
      private setImageAttributes(opt: DrawableElementAttributes): void {
            if (!opt.image || !opt.textureCoords) return;
            this.vertexShader.setVertexShaderForTexture();
            this.fragmentShader.setFragmentShaderForTexture();

            this.attributes.push({ name: WebGLShaders.A_TEXTURE_COORDINATES, value: opt.textureCoords, dim: 2 });
            this.uniforms.push(
                  this.createUniform(WebGLShaders.U_TEXTURE, ProgramAttributes.TEXTURE)
            );
            this.renderer.renderer.createTexture(opt.image);
            this.setAnimationAttributes(opt);
      }

      // Private method to set up uniform color attributes
      private setUniformColorAttributes(opt: DrawableElementAttributes): void {
            if (!opt.color) return;
            this.vertexShader.setVertexShaderForUniformColor();
            this.fragmentShader.setFragmentShaderForUniformColor();
            this.attributes.push({ name: WebGLShaders.A_COLOR, value: opt.color, dim: 4 });
      }

      // Private method to gather attributes and uniforms based on drawable element attributes
      private getProgramAttributes(opt: DrawableElementAttributes): void {

            this.attributes.push({ name: WebGLShaders.A_POSITION, value: opt.vertices, dim: 3 });
            this.uniforms.push(
                  this.createUniform(WebGLShaders.U_TRANSFORM, ProgramAttributes.MAT4),
                  this.createUniform(WebGLShaders.U_PROSPECTIVE, ProgramAttributes.MAT4)
            );

            this.setImageAttributes(opt);

            this.setUniformColorAttributes(opt);
      }
}

import * as Renderer from './renderer.js';
import * as Type from './rendererModel.js'
import { WebGLShaders } from './shaderGL.js';

export class ProgramAttributes {

      // Shader instances
      private vertexShader = new WebGLShaders(WebGLShaders.VERTEX);
      private fragmentShader = new WebGLShaders(WebGLShaders.FRAGMENT);

      // Shader source code
      fragment: string = '';
      vertex: string = '';

      // Data for attributes and uniforms
      attributes: Type.BufferData[] = [];
      uniforms: Type.UniformData[] = [];

      // Index for animation, transform, and prospective uniforms
      animation = -1;
      transform = 0;
      prospective = 1;

      constructor(private renderer: Renderer.RendererDelegate, opt: Renderer.DrawableElementAttributes){ 
            this.getProgramAttributes(opt);
            this.fragment = this.fragmentShader.get();
            this.vertex = this.vertexShader.get();
      }

      private addAttribute(opt: Renderer.BufferOpt){
            this.attributes.push(
                  this.renderer.createBufferData(opt)
            );
      }
      // Private method to set up animation attributes
      private setAnimationAttributes(opt: Renderer.DrawableElementAttributes): void {
            if (!opt.animate) return;
            this.fragmentShader.setFragmentShaderForAnimation();
            this.uniforms.push(
                  this.renderer.createUniform(WebGLShaders.U_ANIMATION, this.renderer.VEC2)
            );
            this.animation = this.uniforms.length - 1;
      }

      // Private method to set up image attributes
      private setImageAttributes(opt: Renderer.DrawableElementAttributes): void {
            if (!opt.image || !opt.textureCoords) return;
            this.vertexShader.setVertexShaderForTexture();
            this.fragmentShader.setFragmentShaderForTexture();

            this.addAttribute({ 
                  attributeName: WebGLShaders.A_TEXTURE_COORDINATES, 
                  data: new Float32Array(opt.textureCoords), 
                  numberOfComponents: 2 
            });
            this.uniforms.push(
                  this.renderer.createUniform(WebGLShaders.U_TEXTURE, this.renderer.TEXTURE)
            );
            this.renderer.createTexture(opt.image);
            this.setAnimationAttributes(opt);
      }

      // Private method to set up uniform color attributes
      private setUniformColorAttributes(opt: Renderer.DrawableElementAttributes): void {
            if (!opt.color) return;
            this.vertexShader.setVertexShaderForUniformColor();
            this.fragmentShader.setFragmentShaderForUniformColor();
            this.addAttribute({ 
                  attributeName: WebGLShaders.A_COLOR, 
                  data: new Float32Array(opt.color), 
                  numberOfComponents: 4 
            });
      }

      // Private method to gather attributes and uniforms based on drawable element attributes
      private getProgramAttributes(opt: Renderer.DrawableElementAttributes): void {

            this.addAttribute({ 
                  attributeName: WebGLShaders.A_POSITION, 
                  data: new Float32Array(opt.vertices), 
                  numberOfComponents: 3 
            });
            this.uniforms.push(
                  this.renderer.createUniform(WebGLShaders.U_TRANSFORM, this.renderer.MAT4),
                  this.renderer.createUniform(WebGLShaders.U_PROSPECTIVE, this.renderer.MAT4)
            );

            this.setImageAttributes(opt);

            this.setUniformColorAttributes(opt);
      }

      setMatrices(transform: number[], prospective: number[], animationVector?: [number, number]): void {
            this.uniforms[this.transform].value = transform;
            this.uniforms[this.prospective].value = prospective;
            if (this.animation >= 0) {
                  this.uniforms[this.animation].value = animationVector || [0, 0];
            }
      }
}
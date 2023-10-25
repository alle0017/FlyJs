import { DrawableElementAttributes, } from "./generics.js";
import { WebGLShaders } from "./shaderGL.js";
import { GLRenderer } from "./renderer.js";

type Uniform = {
      location: WebGLUniformLocation;
      value: number | Iterable<number>;
      transpose: boolean;
      name: string;
      type: number;
}
type AttributesData = {
      name: string;
      value: number[];
      dim: number;
}


export class ProgramAttributes {

      static readonly MAT4 = 1;
      static readonly TEXTURE = 2;
      static readonly FLOAT = 3;
      static readonly VEC4 = 4;
      static readonly MAT3 = 5;
      static readonly VEC2 = 6;


      private vertexShader = new WebGLShaders(WebGLShaders.VERTEX);
      private fragmentShader = new WebGLShaders(WebGLShaders.FRAGMENT);

      fragment: string;
      vertex: string;

      attributes: AttributesData[] = [];
      uniforms: Uniform[] = [];

      animation = -1;
      transform = 0;
      prospective = 1;


      constructor(private renderer: GLRenderer, opt: DrawableElementAttributes){
            this.getProgramAttributes(opt);
            this.fragment = this.fragmentShader.get();
            this.vertex = this.vertexShader.get();
      }
      private createUniform(name: string, type?: number, value: number | Iterable<number> = 0, transpose: boolean = false): Uniform{
            return {
                  name: name,
                  transpose: transpose,
                  value: value,
                  location: 0,
                  type: type || (typeof value == 'number'? ProgramAttributes.FLOAT: ProgramAttributes.MAT4)
            }
      }
      private setAnimationAttributes(opt: DrawableElementAttributes){
            if(!opt.animate) return;
            this.fragmentShader.setFragmentShaderForAnimation();
            this.uniforms.push(
                  this.createUniform(WebGLShaders.U_ANIMATION, ProgramAttributes.VEC2)
            );
            this.animation = this.uniforms.length - 1;
      }
      private setImageAttributes(opt: DrawableElementAttributes){
            if(!opt.image || !opt.textureCoords) return;
            this.vertexShader.setVertexShaderForTexture();
            this.fragmentShader.setFragmentShaderForTexture();

            this.attributes.push({name: WebGLShaders.A_TEXTURE_COORDINATES, value: opt.textureCoords, dim: 2});
            this.uniforms.push(
                  this.createUniform(WebGLShaders.U_TEXTURE, ProgramAttributes.TEXTURE)
            );
            this.renderer.createTexture(opt.image);
            this.setAnimationAttributes(opt);
      }
      private setUniformColorAttributes(opt: DrawableElementAttributes): void {
            if(!opt.color) return;
            this.vertexShader.setVertexShaderForUniformColor();
            this.fragmentShader.setFragmentShaderForUniformColor();
            this.attributes.push({name: WebGLShaders.A_COLOR, value: opt.color, dim: 4});
      }
      private getProgramAttributes(opt: DrawableElementAttributes) {

            this.attributes.push({name: WebGLShaders.A_POSITION, value: opt.vertices, dim: 3});
            this.uniforms.push(
                  this.createUniform(WebGLShaders.U_TRANSFORM, ProgramAttributes.MAT4), 
                  this.createUniform(WebGLShaders.U_PROSPECTIVE, ProgramAttributes.MAT4)
            );

            this.setImageAttributes(opt);

            this.setUniformColorAttributes(opt);
            
      }
}
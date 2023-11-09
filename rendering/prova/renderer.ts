import { Shader, } from "./shaderModel.js";
import { WebGLShader } from "./GLShaders.js";
import { WebGPUShader } from "./GPUShader.js";

import { WebGPURenderer } from "./GPURenderer.js";
import { WebGLRenderer } from "./GLRenderer.js";

import * as Types from './generics.js';

function rendererFallback<T extends { new (...args: any[]): {} }>( constructor: T ){
      if( navigator.gpu )
            return constructor;
      constructor.prototype = WebGLRenderer;
      return class extends constructor {
            Shader: { new (...args: any[]): Shader } = WebGLShader;
      }
}


@rendererFallback
/**
* 
* @hideconstructor
*/
export class Renderer extends WebGPURenderer {

      Shader: { new (...args: any[]): Shader } = WebGPUShader;

      protected setUpImageShader( shader: Shader,  opt: Types.DrawableElementAttributes ): void {
            if(!opt.image) return;

            shader.useTexture();

            if(opt.animate)
                  shader.useAnimation2D();

            if(opt.displacementMap)
                  shader.useDisplacementMap();
            return;
      }
      protected setUpColorShader( shader: Shader, opt: Types.DrawableElementAttributes ): void {
            if(opt.staticColor)
                  shader.useUniformColor(
                        opt.staticColor.r, 
                        opt.staticColor.g, 
                        opt.staticColor.b, 
                        opt.staticColor.a
                  );
            if(opt.color)
                  shader.useInterpolatedColor();
      }
      protected setupShaders( opt: Types.DrawableElementAttributes ): Shader {
            const shader = new this.Shader();

            this.setUpColorShader( shader, opt );

            this.setUpImageShader( shader, opt );

            if(!opt.static)
                  shader.useDynamicElement();
            if(opt.perspective)
                  shader.usePerspective()

            return shader;
      }

      getDrawFunction( opt: Types.DrawableElementAttributes ): Types.DrawFunction {
            const shaderInfos = this.setupShaders( opt );
            return ()=>{

            }
      }
}
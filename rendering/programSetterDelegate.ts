import * as Types from './generics.js';
import * as Model from './shaders/shaderModel.js';
import { WebGPUShader as GPU } from './shaders/GPUShader.js';
import { WebGLShader as GL } from './shaders/GLShaders.js';
import { AttributesName as AN, UniformsName as UN } from './shaders/shaderModel.js';



export class ProgramSetterDelegate {

      private constructor(){}
      
      private static elaborateData(
            data: Types.DrawableElementAttributes,
            attributes:  Map<string, number[]>, 
            //uniforms:  Map<string, number[]>, 
            infos: Model.Shader
      ): void {
            if( data.staticColor ){
                  const c = data.staticColor;
                  infos.useUniformColor( c.r, c.g, c.b, c.a  );
            }
            if( data.color ){
                  infos.useInterpolatedColor();
                  attributes.set( AN.color, data.color );
            }
            if( data.imageData ){
                  this.elaborateImageData( data.imageData, infos );
            }
            if( data.perspective ){
                  infos.usePerspective();
                  //uniforms.set( UN.perspective, [] );
            }
            if( !data.static ){
                  infos.useDynamicElement();
                  //uniforms.set( UN.transformation, [] );
            }
      }
      private static elaborateImageData( opt: Types.DrawableImageOptions, infos:  Model.Shader ): void {
            infos.useTexture();
            if( opt.displacementMap ){
                  infos.useDisplacementMap();
            }
            if( opt.animate ){
                  infos.useAnimation2D();
            }
      }
      private static unifyVertexBuffers( attributes: Map<string, number[]>, infos: Model.Shader ): number[] {
            const attributesData = infos.get().attributes;
            const length = attributes.get( AN.vertex )!.length/3;
            const buffer: number[] = []
            for( let i = 0; i < length; i++ ){
                  for( let [ key, data ] of attributesData.entries() ){
                        const el = attributes.get( key );
                        if( !el ) continue;
                        buffer.push(...el.slice(i*data.components, (i + 1)*data.components))
                  }
            }
            return buffer;
      }
      static getProperties( data: Types.DrawableElementAttributes, mode: Types.ProgramMode, unifyBuffer: boolean = true ): Types.GPUCodeProperties {
            const infos = mode === Types.ProgramMode.webgpu? new GPU(): new GL();
            const attributes: Map<string, number[]> = new Map<string, number[]>();
            //const uniforms: Map<string, number[]> = new Map<string, number[]>;
            this.elaborateData( data, attributes, infos );
            attributes.set( AN.vertex, data.vertices );
            return {
                  ...infos.get(),
                  attributesData: attributes,
                  //uniformsData: uniforms,
                  unifiedAttributeBuffer: unifyBuffer? this.unifyVertexBuffers( attributes, infos ): [],
            };
      }
}
import * as Model from './shaderModel.js';

export class WebGLShader extends Model.Shader {
      
      protected fragmentUniforms: string[] = [];

      static setTypes(){
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
      protected getType(type: number): string {
            if(!WebGLShader.types[type])
                  throw 'type not recognized '+ type;
            return WebGLShader.types[type];
      }
      protected resetVariables(): this {
            this.uniforms = [];
            this.varyings = [];
            this.attributes = [];
            this.fragmentUniforms = [];

            this.vCode = [];
            this.fCode = [];

            this.fragmentReturnedValue = '';
            this.vertexReturnedValue = '';

            return this;
      }


      protected getFragment(): string {
            const code = this.fCode.length? 
            this.fCode.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`): 
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
      protected getVertex(): string {
            const code = this.vCode.length? 
            this.vCode.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`): 
            '';
            return `
            ${this.getAttributesDefinition()}

            ${this.getUniformsDefinition(WebGLShader.VERTEX)}

            ${this.getVaryingsDefinition()}

            void main() {
                  ${code}
                  gl_Position = ${this.vertexReturnedValue};
            }
            `;
      }


      protected getUniformsDefinition(type: number): string {
            if(type === WebGLShader.FRAGMENT){
                  return this.fragmentUniforms.length? 
                  this.fragmentUniforms.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`)
                  :'';
            }
            return this.uniforms.length? 
            this.uniforms.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`)
            :'';
      }
      protected getVaryingsDefinition(): string {
            return this.varyings.length? 
            this.varyings.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`)
            :'';
      }
      protected getAttributesDefinition(): string {
            return this.attributes.length? 
            this.attributes.reduce((prev, next)=> `${prev}\n\t\t\t\t\t${next}`)
            :'';
      }


      protected addAttribute(name: string, type: number): this {
            this.attributes.push(`attribute ${this.getType(type)} ${name};`);
            return this;
      }
      protected addUniform(name: string, type: number, shaderType: number): this {
            if(shaderType === WebGLShader.FRAGMENT)
                  this.fragmentUniforms.push(`uniform ${this.getType(type)} ${name};`);
            else  
                  this.uniforms.push(`uniform ${this.getType(type)} ${name};`);
            return this;
      }
      protected addVarying(name: string, type: number): this {
            this.varyings.push(`varying ${this.getType(type)} ${name};`);
            return this;
      }


      useAnimation2D(): this {

            return this;
      }
      useTexture(): this {
            this
            .addUniform('texture', WebGLShader.TEXTURE2D, WebGLShader.FRAGMENT)
            .addUniform('prospective', WebGLShader.MAT4x4, WebGLShader.VERTEX)
            .addUniform('transformation', WebGLShader.MAT4x4, WebGLShader.VERTEX)
            .addAttribute('position', WebGLShader.VEC3)
            .addAttribute('text_coords', WebGLShader.VEC4)
            .addVarying('v_text_coords', WebGLShader.VEC4);

            this.vCode.push(`
                  v_text_coords = text_coords;
            `)

            this.vertexReturnedValue = 'prospective * transformation * vec4(position, 1)';
            this.fragmentReturnedValue = `texture2D( texture, v_text_coords )`;

            return this;
      }
      useInterpolatedColor(): this {
            this
            .addUniform('prospective', WebGLShader.MAT4x4, WebGLShader.VERTEX)
            .addUniform('transformation', WebGLShader.MAT4x4, WebGLShader.VERTEX)
            .addAttribute('position', WebGLShader.VEC3)
            .addAttribute('color', WebGLShader.VEC4)
            .addVarying('v_color', WebGLShader.VEC4);

            this.vCode.push(`
                  v_color = color;
            `)

            this.vertexReturnedValue = 'prospective * transformation * vec4(position, 1)';
            this.fragmentReturnedValue = `v_color`;

            return this;
      }
      useUniformColor(r: number, g: number, b: number, a: number = 1): this {
            this
            .addUniform('prospective', WebGLShader.MAT4x4, WebGLShader.VERTEX)
            .addUniform('transformation', WebGLShader.MAT4x4, WebGLShader.VERTEX)
            .addAttribute('position', WebGLShader.VEC3);

            this.vertexReturnedValue = 'prospective * transformation * vec4(position, 1)';
            this.fragmentReturnedValue = `vec4(${r}, ${g}, ${b}, ${a})`;

            return this;
      }
      useDisplacementMap(): this {
            this
            .useTexture()
            .addUniform('displacement_map', WebGLShader.TEXTURE2D, WebGLShader.VERTEX);

            this.vCode.push(`
                  float height = texture2D( displacement_map, text_coords );
                  position *= height; 
            `)

            return this;
      }
      get(): Model.ShaderCode {
            return {
                  vertex: this.getVertex(),
                  fragment: this.getFragment(),
            }
      }

}
WebGLShader.setTypes();

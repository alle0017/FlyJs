import * as Model from './shaderModel.js';
import { AttributesName as AN, UniformsName as UN, BindingsName as BN } from './shaderModel.js';

export class WebGLShader extends Model.Shader {
      
      protected static typeSize: Model.TypeInfos[] = [];
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

            this.typeSize[this.VEC4] = {type: 'vec4', components: 4, size: 4};
            this.typeSize[this.VEC3] = {type: 'vec3', components: 3, size: 4};
            this.typeSize[this.VEC2] = {type: 'vec2', components: 2, size: 4};

            this.typeSize[this.INT] = {type: 'int', components: 1, size: 4};
            this.typeSize[this.FLOAT] = {type: 'float', components: 1, size: 4};
            //uniforms => type is patched
            this.typeSize[this.MAT4x4] = {type: 'mat4', components: 16, size: 4};
            this.typeSize[this.MAT3x3] = {type: 'mat3', components: 9, size: 4};
            this.typeSize[this.MAT2x2] = {type: 'mat2', components: 4, size: 4};
            this.typeSize[this.MAT3x2] = {type: 'mat3x2', components: 6, size: 4};
            this.typeSize[WebGLShader.TEXTURE2D] = { type: 'sampler2D', components: 0, size: 0 };
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

            this.positionTransformations = [];

            this.vCode = [];
            this.fCode = [];

            this.fragmentReturnedValue = '';
            this.vertexReturnedValue = '';
            
            this._attributesData.clear();
            this._uniformsData.clear();

            this._functions = '';

            return this;
      }
      private addAttributesData( name: string, type: number ){
            const typeInfo = WebGLShader.typeSize[type];
            if( !type ) return; 
            this._attributesData.set(name, {
                  dataType: typeInfo.type,
                  shaderLocation: 0,
                  components: typeInfo.components,
                  offset: 0,
                  name,
                  size: typeInfo.size
            });
      }
      private addUniformsData( name: string, type: number ){
            const typeInfo = WebGLShader.typeSize[type];
            if( !type ) return; 
            this._uniformsData.set(name, {
                  dataType: typeInfo.type,
                  shaderLocation: 0,
                  components: typeInfo.components,
                  offset: 0,
                  name,
                  size: typeInfo.size
            });
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
            ${this._functions}
            void main() {
                  ${code}
                  gl_Position = ${this.getPositionTransformations()} ${this.vertexReturnedValue};
            }
            `;
      }


      protected getUniformsDefinition(type: number): string {
            if(type === WebGLShader.FRAGMENT){
                  return this.fragmentUniforms.length? 
                  this.fragmentUniforms.reduce((prev, next)=> `${prev}\n${next}`)
                  :'';
            }
            return this.uniforms.length? 
            this.uniforms.reduce((prev, next)=> `${prev}\n${next}`)
            :'';
      }
      protected getVaryingsDefinition(): string {
            return this.varyings.length? 
            this.varyings.reduce((prev, next)=> `${prev}\n${next}`)
            :'';
      }
      protected getAttributesDefinition(): string {
            return this.attributes.length? 
            this.attributes.reduce((prev, next)=> `${prev}\n${next}`)
            :'';
      }
      protected getPositionTransformations(): string {
            if( this.positionTransformations.length )
                  return this.positionTransformations.reduce((prev, next)=> `${prev} * ${next}`) + ' *';
            return '';
      }


      protected addAttribute(name: string, type: number): this {
            this.addAttributesData( name, type );
            this.attributes.push(`attribute ${this.getType(type)} ${name};`);
            return this;
      }
      protected addUniform(name: string, type: number, shaderType: number, arrayLength: number = 0): this {
            if( shaderType === WebGLShader.FRAGMENT ){
                  if( arrayLength ){
                        this.fragmentUniforms.push(`uniform ${this.getType(type)} ${name}[${arrayLength}];`);
                  }else
                        this.fragmentUniforms.push(`uniform ${this.getType(type)} ${name};`);
            }else {
                  if( arrayLength ){
                        this.uniforms.push(`uniform ${this.getType(type)} ${name}[${arrayLength}];`);
                  }else
                        this.uniforms.push(`uniform ${this.getType(type)} ${name};`);
            }
            this.addUniformsData( name, type );
            return this;
      }
      protected addVarying(name: string, type: number): this {
            this.varyings.push(`varying ${this.getType(type)} ${name};`);
            return this;
      }

      usePerspective(): this {
            this.positionTransformations.push(UN.perspective);
            this.addUniform(UN.perspective, WebGLShader.MAT4x4, WebGLShader.VERTEX);
            return this;
      }
      useDynamicElement(): this {
            this.positionTransformations.push(UN.transformation);
            this.addUniform(UN.transformation, WebGLShader.MAT4x4, WebGLShader.VERTEX);
            return this;
      }
      useAnimation2D(): this {

            if( this.attributes.join().indexOf(AN.textureCoordinates) < 0 ){
                  console.warn('cannot use 2d animations in a non-textured element');
                  return this;
            }

            this.addUniform(UN.framePosition, WebGLShader.VEC2, WebGLShader.VERTEX);

            this.vCode.push( `
                  v_text_coords.x += ${UN.framePosition}.x;
                  v_text_coords.y += ${UN.framePosition}.y;
            ` );

            return this;
      }
      useTexture(): this {
            this
            .resetVariables()
            .addUniform(BN.texture, WebGLShader.TEXTURE2D, WebGLShader.FRAGMENT)
            .addAttribute(AN.vertex, WebGLShader.VEC3)
            .addAttribute(AN.textureCoordinates, WebGLShader.VEC2)
            .addVarying('v_text_coords', WebGLShader.VEC2);

            this.vCode.push(`
                  v_text_coords = ${AN.textureCoordinates};
            `)

            this.vertexReturnedValue = `vec4(${AN.vertex}, 1)`;
            this.fragmentReturnedValue = `texture2D( ${BN.texture}, v_text_coords )`;

            return this;
      }
      useInterpolatedColor(): this {
            this
            .resetVariables()
            .addAttribute(AN.vertex, WebGLShader.VEC3)
            .addAttribute(AN.color, WebGLShader.VEC4)
            .addVarying('v_color', WebGLShader.VEC4);

            this.vCode.push(`
                  v_color = ${AN.color};
            `)

            this.vertexReturnedValue = `vec4(${AN.vertex}, 1)`;
            this.fragmentReturnedValue = `v_color`;

            return this;
      }
      useUniformColor(r: number, g: number, b: number, a: number = 1): this {
            this
            .resetVariables()
            .addAttribute(AN.vertex, WebGLShader.VEC3);

            this.vertexReturnedValue = `vec4(${AN.vertex}, 1)`;
            this.fragmentReturnedValue = `vec4(${r}, ${g}, ${b}, ${a})`;

            return this;
      }
      useDisplacementMap(): this {

            if( this.attributes.join().indexOf(AN.textureCoordinates) < 0 ){
                  console.warn('cannot use displacement map in a non-textured element');
                  return this;
            }

            this
            .addUniform(BN.displacementMap, WebGLShader.TEXTURE2D, WebGLShader.VERTEX)
            .addUniform(UN.bumpScale, WebGLShader.FLOAT, WebGLShader.VERTEX);

            this.vCode.push(`
                  float height = texture2D( ${BN.displacementMap}, ${AN.textureCoordinates} );
                  position.y += height * ${UN.bumpScale}; 
            `)

            return this;
      }
      private getSkinningFunction(): string {
            return/*glsl*/`
            mat4 skinning( vec4 weights, vec4 indices ) {
                  mat4 m = mat4(
                        0, 0, 0, 0,
                        0, 0, 0, 0,
                        0, 0, 0, 0,
                        0, 0, 0, 0
                        );
                  for( int i = 0; i < 4; i++ ) {
                        m+= bones[ int(indices[i]) ]*weights[i];
                  }
                  return m;
            }
            `;
      }
      useSkeletalAnimation( bones: number ): this {
            const SKINNING_MAT = 'skinning_mat';
            this._functions += this.getSkinningFunction();
            this
            .addUniform( `${BN.bones}`, WebGLShader.MAT4x4, WebGLShader.VERTEX, bones )
            .addAttribute( AN.skIndices, WebGLShader.VEC4 )
            .addAttribute( AN.skWeights, WebGLShader.VEC4 )
            .vCode.push(
                  /* glsl */` mat4 skinning_mat = skinning( ${AN.skWeights}, ${AN.skIndices} );`
            )
            this.positionTransformations.push( SKINNING_MAT );
            return this;
      }
      get(): Model.ProgramInfo {
            return {
                  attributes: this._attributesData,
                  uniforms: this._uniformsData,
                  uniformsName: [],
                  attributeStride: 0,
                  uniformStride: 0,
                  vertex: this.getVertex(),
                  fragment: this.getFragment(),
            }
      }

}
WebGLShader.setTypes();
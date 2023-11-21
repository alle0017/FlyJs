import * as Model from './shaders/shaderModel.js';
import { 
      ProgramMode,
      DrawableImageOptions,
      DrawableElementAttributes,
      GPUCodeProperties,
      Axis,
      Point3D,
 } from './types.js';
import { WebGPUShader as GPU } from './shaders/GPUShader.js';
import { WebGLShader as GL } from './shaders/GLShaders.js';
import { AttributesName as AN, } from './shaders/shaderModel.js';
import { Matrix } from './matrix/matrices.js';

type Bone = {
      // initial position of the bone
      inversePose: number[],
      // matrix that represents the local transformation
      // in global reference
      transformationMatrix: number[],
}
type Skeleton = {
      bones: Bone[],
      indices: number[],
      // root node of the skeleton
      root: number
}
export namespace Setter {
      function elaborateData(
            data: DrawableElementAttributes,
            attributes:  Map<string, number[]>, 
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
                  elaborateImageData( data.imageData, infos );
                  attributes.set( AN.textureCoordinates, data.imageData.textureCoords );
            }
            if( data.perspective ){
                  infos.usePerspective();
            }
            if( !data.static ){
                  infos.useDynamicElement();
            }
            if( data.bonesData ){
                  infos.useSkeletalAnimation( data.bonesData.bones );
                  attributes.set( AN.skIndices, data.bonesData.indices );
                  attributes.set( AN.skWeights, data.bonesData.weights );
            }
      }
      function elaborateImageData( opt: DrawableImageOptions, infos:  Model.Shader ): void {
            infos.useTexture();
            if( opt.displacementMap ){
                  infos.useDisplacementMap();
            }
            if( opt.animate ){
                  infos.useAnimation2D();
            }
      }
      function unifyVertexBuffers( attributes: Map<string, number[]>, infos: Model.Shader ): number[] {
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
      export function getProperties( data: DrawableElementAttributes, mode: ProgramMode, unifyBuffer: boolean = true ): GPUCodeProperties {
            const infos = mode === ProgramMode.webgpu? new GPU(): new GL();
            const attributes: Map<string, number[]> = new Map<string, number[]>();
            elaborateData( data, attributes, infos );
            attributes.set( AN.vertex, data.vertices );
            return {
                  ...infos.get(),
                  attributesData: attributes,
                  unifiedAttributeBuffer: unifyBuffer? unifyVertexBuffers( attributes, infos ): [],
            };
      }
      export function calculateSkeletonPosition( bones: Skeleton, angles: number[], translations: Point3D[] ){
            const outMatrices: number[][] = [];
            bones.bones.forEach( (bone, i) =>{
                  const localMatrix = Matrix.composeMatrix(
                        Matrix.rotation( angles[i], Axis.Z ),
                        4,
                        Matrix.translate( translations[i] )
                  );
                  if( i === bones.root )
                        bone.transformationMatrix = localMatrix;
                  else  
                        bone.transformationMatrix = Matrix.composeMatrix(
                              bones.bones[ bones.indices[i] ].transformationMatrix,
                              4,
                              localMatrix
                        );
                  bone.inversePose = Matrix.invert( bone.transformationMatrix, 4 );
                  outMatrices.push( Matrix.composeMatrix(
                        bone.inversePose,
                        4,
                        bone.transformationMatrix
                  ))
                  return outMatrices;
            })
      }
}
import { 
      TypedArrayConstructor, 
      RendererErrorType,
      BufferDataType, 
      BufferOpt, 
      Primitives, 
      BufferData, 
      BufferUsage,
} from "./generics.js";

export abstract class Renderer {
      abstract antialias: boolean;
      protected getTypedArrayInitializer( type: BufferDataType ): TypedArrayConstructor {
            if( type === BufferDataType.uint16 )
                  return Uint16Array;
            return Float32Array;
      }
      protected getPrimitivesVertexCount( primitive: Primitives ): number {
            switch( primitive ){
                  case Primitives.lines: return 2;
                  case Primitives.lines_strip: return 2;
                  case Primitives.triangles: return 3;
                  case Primitives.triangles_strip: return 3;
                  default: return 1;
            }
      }
      protected abstract getPrimitive( primitive: Primitives ): any;
      protected abstract getBufferUsage( bufferUsage: BufferUsage ): number;
      protected abstract createBufferData( arg: BufferData ): any;
      protected abstract createBuffer( opt: Partial<BufferOpt> ): any;
      protected abstract createShader( code: string, ...args: any ): any;
      protected error( component: string, type: RendererErrorType ): void {
            throw `something went wrong in ${component} ${type}`;
      }
}
import { 
      TypedArrayConstructor, 
      RendererErrorType,
      BufferDataType, 
      BufferOpt, 
      Primitives, 
      BufferData, 
} from "./generics.js";

export abstract class Renderer {
      protected getTypedArrayInitializer( type: BufferDataType ): TypedArrayConstructor {
            if( type === BufferDataType.uint16 )
                  return Uint16Array;
            return Float32Array;
      }
      protected abstract getPrimitive( primitive: Primitives ): any;
      protected abstract createBufferData( arg: BufferData ): any;
      protected abstract init(): Promise<this>;
      protected abstract createBuffer( opt: Partial<BufferOpt> ): any;
      protected abstract createShader( code: string ): any;
      protected error( component: string, type: RendererErrorType ): void {
            throw `something went wrong in ${component} ${type}`;
      }
}
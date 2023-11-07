export type Buffer = WebGLBuffer;
export type Program = WebGLProgram;
export type Uniform = WebGLUniformLocation;
export type Shader = WebGLShader;
export type Texture = WebGLTexture;
export type AttributeLocation = number;

export type Color = {
      r: number;
      g: number;
      b: number;
      a: number;
}

export type BufferData = {
      buffer: Buffer;
      location: number;
      data: TypedArray;
      numberOfComponents: number;
      attributeName: string;
      type: number;
      stride: number;
      offset: number;
      normalize: boolean;
      indices: boolean;
      dataType: number;
}

export type UniformData = {
      location: Uniform;
      value: number | Iterable<number>;
      transpose: boolean;
      name: string;
      dataType: number;
}

export type TypedArray = Float32Array | Uint16Array;



export abstract class Renderer {
      
      readonly abstract MAT4: number;
      readonly abstract TEXTURE: number;
      readonly abstract FLOAT: number;
      readonly abstract BYTE: number;
      readonly abstract SHORT: number;
      readonly abstract UNSIGNED_BYTE: number;
      readonly abstract UNSIGNED_SHORT: number;
      readonly abstract VEC4: number;
      readonly abstract MAT3: number;
      readonly abstract VEC2: number;

      readonly abstract INDEX_BUFFER: number;
      readonly abstract BUFFER: number;

      readonly abstract FRAGMENT_SHADER: number;
      readonly abstract VERTEX_SHADER: number;


      abstract createBuffer(data: TypedArray, type: number, staticDraw: boolean): Buffer;

      abstract createProgram(vShader: string, fShader: string): Program;

      abstract createShader(sourceCode: string, type: number): Shader;

      abstract createTexture(image: HTMLImageElement): Texture;

      abstract getUniformLocation(uniform: string, program: Program): Uniform;

      abstract getAttributeLocation(attribute: string, program: Program): AttributeLocation;

      abstract bindBuffer(bufferData: BufferData): void;

      abstract bindAndEnableBuffer(bufferData: BufferData): void;

      abstract bindUniform(uniform: UniformData): void;

      abstract clear(color: Color): void;

      abstract enableCulling(depthTest: boolean): void;

      abstract resizeCanvas(width: number, height: number): void;

      abstract draw(vertexCount: number): void;

      abstract useProgram(program: Program): void;
}
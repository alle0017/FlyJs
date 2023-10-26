import { DrawOpt, DrawFunction, Axis, DrawableElementAttributes, } from "./generics.js";
import { Matrix } from "./matrices.js";
import { ProgramAttributes } from "./programAttributes.js";
import { GLRendererDelegate } from "./glRenderer.js";

/**
 * Represents a WebGL buffer configuration.
 */
type Buffer = {
      buffer: WebGLBuffer;          // The WebGL buffer object.
      location: number;             // Attribute location in a shader program.
      data: TypedArray;              // The data to fill the buffer with, of type TypedArray.
      numberOfComponents: number;    // Number of components per vertex attribute (e.g., 1, 2, 3, or 4).
      attributeName: string;         // Name of the attribute.
      type?: number;                 // WebGL buffer type (e.g., gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER).
      stride?: number;               // Specifies the offset in bytes between consecutive vertex attributes.
      offset?: number;               // Specifies an offset in bytes of the first component in the vertex attribute array.
      normalize?: boolean;           // Boolean indicating whether integer data values should be normalized.
}
  
/**
* Represents a union type of various typed arrays that can be used in WebGL buffers.
*/
type TypedArray = Float32Array | Float64Array | Uint16Array | Uint32Array | Int16Array | Int32Array;
  

export class GLRenderer {
      // Camera properties
      private _near: number = 0.1;               // Near clipping plane distance.
      private _far: number = 50;                 // Far clipping plane distance.
      private _resolution: number;                // Resolution (not initialized in the provided code).
      private _fieldOfView: number = 60;         // Field of view angle in degrees.

      // Renderer reference
      renderer;

      // Perspective matrix 
      prospectiveMatrix: Float32Array = new Float32Array(16);

      // Constants
      static readonly axis = Axis;               // Reference to axis constants.

      /**
      * Setter for the near clipping plane distance.
      * @param {number} zNear - The new value for the near clipping plane distance.
      */
      set zNear(zNear: number) {
            if (this._near === zNear) return;
            this._near = zNear;
            this.updateProspectiveMatrix();
      }

      /**
      * Getter for the near clipping plane distance.
      * @returns {number} The near clipping plane distance.
      */
      get zNear() {
            return this._near;
      }

      /**
      * Setter for the far clipping plane distance.
      * @param {number} zFar - The new value for the far clipping plane distance.
      */
      set zFar(zFar: number) {
            if (this._far === zFar) return;
            this._far = zFar;
            this.updateProspectiveMatrix();
      }

      /**
      * Getter for the far clipping plane distance.
      * @returns {number} The far clipping plane distance.
      */
      get zFar(): number {
            return this._far;
      }

      /**
      * Setter for the field of view angle.
      * @param {number} angle - The new value for the field of view angle (in degrees).
      */
      set fieldOfView(angle: number) {
            if (this._fieldOfView === angle) return;
            this._fieldOfView = angle;
            this.updateProspectiveMatrix();
      }

      /**
      * Getter for the field of view angle.
      * @returns {number} The field of view angle (in degrees).
      */
      get fieldOfView(): number {
            return this._fieldOfView;
      }


      /**
      * Constructor for the Camera class.
      * @param {WebGLRenderingContext | null} ctx - The WebGL rendering context.
      * @throws {Error} Throws an error if WebGL is not available.
      */
      constructor(ctx: WebGLRenderingContext | null) {
            // Check if WebGL context is available
            if (!ctx) throw new Error("WebGL not available");

            // Initialize the renderer with the provided WebGL context
            this.renderer = new GLRendererDelegate(ctx);

            // Calculate the initial resolution based on the canvas dimensions
            this._resolution = ctx.canvas.width / ctx.canvas.height;

            // Update the perspective matrix based on initial camera properties
            this.updateProspectiveMatrix();
      }
      /**
      * Updates the perspective matrix based on camera properties.
      * @private
      */
      private updateProspectiveMatrix() {
            // Calculate and assign a new perspective matrix based on camera properties
            this.prospectiveMatrix = new Float32Array(
                  Matrix.prospective(this._fieldOfView, this._resolution, this._near, this._far)
            );
      }
      /**
       * 
       * @param {TypedArray} data the data to fill the buffer with
       * @param type the type of the buffer (e.g. gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER)
       * @param numberOfComponents number between 1 and 4 that indicates number of components (default is 3)
       * @param staticDraw optional. if is true, the buffer is set to static usage, otherwise to dynamic (default to false)
       * @returns Buffer or null if the creation failed. initially, the location attribute is set to 0
       */
      createBuffer(data: TypedArray, type: number,  attributeName: string = '', numberOfComponents: number = 3, staticDraw: boolean = false): Buffer | null {
            const buffer = this.renderer.createBuffer(data, type, staticDraw);
            if(!buffer){
                  return null;
            }
            if(numberOfComponents <= 0 || numberOfComponents > 4){
                  console.warn('number of components must be greater than 0 and less than 4. automatically set to 3');
                  numberOfComponents = 3;
            }
            return {
                  buffer: buffer,
                  location: 0,
                  data: data,
                  numberOfComponents: Math.floor(numberOfComponents),
                  attributeName: attributeName
            }
      }
      /**
      * Resizes the canvas and updates the resolution based on the new dimensions.
      * @param {number} width - The new width of the canvas.
      * @param {number} height - The new height of the canvas.
      */
      resizeCanvas(width: number, height: number): void {
            this.renderer.resizeCanvas(width, height);
            this._resolution = width/height;
      }
      /**
      * Selects the translation matrix from DrawOpt or creates one based on the translation vector.
      * @param {DrawOpt} opt - The drawing options.
      * @returns {Float32Array | null} The translation matrix or null if not provided.
      */
      selectTranslationMatrix(opt: DrawOpt): number[] | null{
            if(opt.translationMatrix){
                  return opt.translationMatrix;
            }else if(opt.translation){
                  return Matrix.translate(opt.translation);
            }
            return null;
      }
      /**
      * Selects the rotation matrix from DrawOpt or creates one based on the rotation angle and axis.
      * @param {DrawOpt} opt - The drawing options.
      * @returns {Float32Array | null} The rotation matrix or null if not provided.
      */
      selectRotationMatrix(opt: DrawOpt): number[] | null{
            if(opt?.rotationMatrix){
                  return opt.rotationMatrix;
            }else if(opt.angle || opt.axis){
                  return Matrix.rotation(
                              (opt && opt.angle) || 0.0,
                              (opt && opt.axis) || Axis.X,
                              (opt && opt.toRad) || false
                  )
            }
            return null;
      }
      /**
      * Selects the scale matrix from DrawOpt or creates one based on the scale vector.
      * @param {DrawOpt} opt - The drawing options.
      * @returns {Float32Array | null} The scale matrix or null if not provided.
      */
      selectScaleMatrix(opt: DrawOpt): number[] | null{
            if(opt.scaleMatrix){
                  return  opt.scaleMatrix;
            }else if(opt.scale){
                  return Matrix.scale(opt.scale);
            }
            return null;
      }
      /**
      * Combines translation, rotation, and scale matrices to create the final transformation matrix.
      * @param {DrawOpt} opt - The drawing options.
      * @returns {Float32Array} The transformation matrix.
      */
      setTransformationMatrix(opt?: DrawOpt): number[] {
            let transformationMatrix = Matrix.IDENTITY_4X4;
            
            // If no drawing options provided, return the identity matrix
            if (!opt) return transformationMatrix;
      
            // If a specific transformation matrix is provided, return it
            if (opt.transformationMatrix) return opt.transformationMatrix;
      
            // Select and compose translation, rotation, and scale matrices
            const translation = this.selectTranslationMatrix(opt);
            if (translation)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, translation);
      
            const rotation = this.selectRotationMatrix(opt);
            if (rotation)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, rotation);
      
            const scale = this.selectScaleMatrix(opt);
            if (scale)
            transformationMatrix = Matrix.composeMatrix(transformationMatrix, 4, scale);
      
            // If a camera is provided, combine with the transformation matrix
            if (opt.camera)
            transformationMatrix = Matrix.composeMatrix(opt.camera.matrix, 4, transformationMatrix);
      
            return transformationMatrix;
      }
      /**
      * Creates an array of buffers based on the attributes defined in the ProgramAttributes object.
      * @param {ProgramAttributes} codeAttr - The ProgramAttributes object containing attribute information.
      * @returns {Buffer[] | null} An array of buffers or null if buffer creation fails.
      */
      getBuffersFromProgramAttributes(codeAttr: ProgramAttributes): Buffer[] | null{
            const buffers: Buffer[] = [];
            for(let el of codeAttr.attributes){
                  const tmp = this.createBuffer(
                        new Float32Array(el.value), 
                        this.renderer.ARRAY_BUFFER, 
                        el.name, 
                        el.dim
                  );
                  if(!tmp)
                        return null;
                  buffers.push(tmp);
            }
            return buffers;
      }
      /**
      * Retrieves a drawing function based on the provided attributes.
      * @param {DrawableElementAttributes} opt - Attributes for the drawable element.
      * @returns {DrawFunction | null} The drawing function or null if creation fails.
      */
      getDrawFunction(opt: DrawableElementAttributes): DrawFunction | null {
            // Function to fill indices if not provided
            const fillIndex = () => {
            opt.indices = [];
            for (let i = 0; i < opt.vertices.length / 3; i++)
                  opt.indices.push(i);
            }
      
            // Create a ProgramAttributes instance for managing shaders and uniforms
            const codeAttr = new ProgramAttributes(this, opt);
      
            // Create a WebGL program
            const program = this.renderer.createProgram(codeAttr.vertex, codeAttr.fragment);
            if (!program) return null;
      
            // Retrieve buffers from the ProgramAttributes
            const buffers: Buffer[] | null = this.getBuffersFromProgramAttributes(codeAttr);
      
            // Return null if buffers creation fails
            if (!buffers) return null;
      
            // Get attribute locations in the WebGL program
            this.renderer.getAttribLocations(buffers, program);
      
            // Get uniform locations in the WebGL program
            this.renderer.getUniformLocation(codeAttr.uniforms, program);
      
            // If indices are not provided, generate them
            if (!opt.indices) fillIndex();
      
            // Create an indices buffer
            const indicesBuffer = this.createBuffer(new Uint16Array(opt.indices as number[]), this.renderer.ELEMENT_ARRAY_BUFFER);
            if (!indicesBuffer) return null;
      
            // Return the drawing function
            return (opt?: DrawOpt) => {
                  // Use the WebGL program
                  this.renderer.useProgram(program);
      
                  // Bind buffers for rendering
                  this.renderer.bindBuffers(buffers);
      
                  // Bind the indices buffer
                  this.renderer.bindIndicesBuffer(indicesBuffer.buffer);
            
                  // Set transformation and perspective matrices
                  codeAttr.uniforms[codeAttr.transform].value = this.setTransformationMatrix(opt);
                  codeAttr.uniforms[codeAttr.prospective].value = this.prospectiveMatrix;
            
                  // If there is an animation uniform, set its value
                  if (codeAttr.animation >= 0) {
                        codeAttr.uniforms[codeAttr.animation].value = opt?.animationVector || [0, 0];
                  }
            
                  // Bind uniforms for rendering
                  this.renderer.bindUniforms(codeAttr.uniforms);
            
                  // Draw elements
                  this.renderer.draw(indicesBuffer.data.length);
            };
      }
      
}

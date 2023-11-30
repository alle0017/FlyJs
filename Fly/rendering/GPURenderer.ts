
import { WebGPU, Resources } from "./codeDelegates/GPUcode.js";
import { ProgramSetterDelegate, } from "./programSetterDelegate.js";
import { ViewDelegate } from "./matrix/viewMatrix.js";
import { UniformsName as UN, BindingsName as BN } from './shaders/shaderModel.js';
import { UNIFORM } from "./shaders/GPUShader.js";
import { 
      DrawableElementAttributes,
      ProgramMode, 
      BufferDataType, 
      BufferUsage, 
      Primitives, 
      RendererErrorType,
      DrawOpt,
      DrawableImageOptions,
      WebGPURenderable,
      RenderableArrays,
      Skeleton,
      Bone,
      SkeletalAnimationOptions
 } from './types.js';
import { Matrix } from "./matrix/matrices.js";

type UniformInformation = { 
      buffer: GPUBuffer | undefined, 
      bindGroup: GPUBindGroup, 
      boneBuffer: GPUBuffer | undefined,
} 
type WebGPURenderFunctionData = {
      pipeline: GPURenderPipeline,
      vertexBuffer: GPUBuffer,
      N_OF_VERTICES: number,
      indexBuffer: GPUBuffer,
      uniformsBindGroup: GPUBindGroup | undefined,
}
type UniformsSetterFunction = {
      [ T in UN ]: ()=>void;
};

export class WebGPURenderer extends WebGPU {
      protected objects: Map<string,WebGPURenderable> = new Map<string,WebGPURenderable>();
      protected renderPassDescriptor?: GPURenderPassDescriptor;
      private view: ViewDelegate;

      private transparency: boolean = false;

      constructor( cvs: HTMLCanvasElement ){
            super( cvs );
            this.view = new ViewDelegate( this.cvs.width/this.cvs.height );
      }

      override async init(): Promise<this> {
            await super.init();
            this.renderPassDescriptor = this.createRenderPassDescriptor( true );
            return this;
      }
      private setIndexArray( vertices: number, primitive: Primitives ): number[]{
            // get the number of vertices needed to draw a single primitive
            // 1 for points, 2 for lines, 3 for triangles
            const count = this.getPrimitivesVertexCount( primitive );
            const indices: number[] = [];
            // number of vertices divided by the number 
            // of vertices used for each primitive
            for( let i = 0; i < vertices/count; i++ )
                  indices.push(i);
            return indices;
      }
      private createRenderFunction( opt: WebGPURenderFunctionData ) {
            // function tha is executed even if uniforms are not used
            const defaultRenderFunc = ( pass: GPURenderPassEncoder )=>{
                  pass.setIndexBuffer( opt.indexBuffer, 'uint16' );
                  pass.setVertexBuffer( 0, opt.vertexBuffer );
                  pass.drawIndexed( opt.N_OF_VERTICES )
            }
            // the function is called without checking if uniforms exists
            if( !opt.uniformsBindGroup )
                  return ( pass: GPURenderPassEncoder )=>{
                        pass.setPipeline( opt.pipeline );
                        defaultRenderFunc( pass );
                  }
            /** 
            * set only the bind group
            * {@link WebGPURenderer.setAttributes} to understand why 
            * we don't write buffers during each rendering
            */
            return ( pass: GPURenderPassEncoder )=>{
                  pass.setPipeline( opt.pipeline );
                  pass.setBindGroup( 0, opt.uniformsBindGroup! );
                  defaultRenderFunc( pass );
            }
      }
      private useImage( image: ImageBitmap ): GPUTexture {
            //create the texture
            const texture = this.createTexture({
                  usage: 
                        GPUTextureUsage.TEXTURE_BINDING |
                        GPUTextureUsage.COPY_DST |
                        GPUTextureUsage.RENDER_ATTACHMENT,
                  width: image.width,
                  height: image.height,
                  format: 'rgba8unorm'

            });
            //copy the image over it
            this.device?.queue.copyExternalImageToTexture(
                  //flipY to false to use it like webgl
                  { source: image, flipY: false, },
                  { texture, premultipliedAlpha: true },
                  { width: image.width, height: image.height },
            );
            return texture;
      }
      private initUniformsBuffers( pipeline: GPURenderPipeline, stride: number, bindings: string[], imageData?: DrawableImageOptions, bones?: number ): UniformInformation {
            // resources that are passed to define the bind group
            const buffers: Resources[] = [];
            // uniform buffer
            let buffer: GPUBuffer | undefined;
            // buffer used for skeletal animation
            let boneBuffer: GPUBuffer | undefined;
            // object used to map the binding names and 
            // uniforms to the initialization function
            const funcs: { [k in BN]: (arg: any)=>void;} & { [UNIFORM]: (arg: any)=>void } = {
                  // create the texture for displacement map
                  [BN.displacementMap]: (resource: Resources)=>{
                        if( imageData && imageData.displacementMap )
                        resource.texture = this.useImage( imageData.displacementMap! ).createView();
                  },
                  // create the texture that will be displayed
                  [BN.texture]: (resource: Resources)=>{
                        
                        if( imageData )
                        resource.texture = this.useImage( imageData.image ).createView();
                  },
                  // create a sampler
                  [BN.textureSampler]: (resource: Resources)=>{
                        resource.texture = this.device?.createSampler();
                  },
                  // init the bone buffer
                  [BN.bones]: ( resource: Resources )=>{
                        if( !bones )
                              this.error( `uniform bind group (bones number not defined)`, RendererErrorType.initialization )
                        boneBuffer = this.createBuffer({
                              // 16 elements for each matrix
                              arrayByteLength: Float32Array.BYTES_PER_ELEMENT * 16 * bones!,
                              usage: BufferUsage.uniform,
                              label: 'bones buffer'
                        });
                        resource.buffer = boneBuffer;
                  },
                  //init the uniform buffer
                  [UNIFORM]: (resource: Resources)=>{
                        buffer = this.createBuffer({
                              label: 'Uniform Buffer',
                              arrayByteLength: stride,
                              usage: BufferUsage.uniform,
                        });
                        resource.buffer = buffer;
                  }
            };
            // loop over the different bindings
            for( let i = 0; i < bindings.length; i++ ){
                  const resource: Resources = {
                        location: i,
                  }
                  if( funcs[ bindings[i] as BN ] ){
                        funcs[ bindings[i] as BN ]( resource );
                  }else{
                        this.error( `uniform bind group (name ${bindings[i]} not recognized)`, RendererErrorType.initialization )
                  }
                  buffers.push( resource )
            }
            const bindGroup = this.createUniformBindingGroup( {
                  pipeline,
                  buffers
            })
            return {
                  buffer,
                  boneBuffer,
                  bindGroup,
            }
      }
      private setProgramAttributes( opt: DrawableElementAttributes ){
            /**
            get the program attributes needed @see WebGPUShader
            */
            const data = ProgramSetterDelegate.getProperties( opt, ProgramMode.webgpu );
            //create the pipeline
            const pipeline = this.createPipeline({
                  //vertex shader
                  vShader: data.vertex,
                  //fragment shader
                  fShader: data.fragment,
                  //buffer data
                  buffers: [...data.attributes.values()],
                  //total length of attributes array
                  stride: data.attributeStride,
                  //use depth for the shader
                  enableDepth: true,
                  //if not set default triangles
                  topology: opt.primitive || Primitives.triangles
            });
            //create the vertex buffer
            const vertexBuffer = this.createBuffer({
                        data: data.unifiedAttributeBuffer,
                        dataType: BufferDataType.float32,
                        label: 'vertex buffer',
            });
            //if indices is not passed is sequentially created
            if( !opt.indices ){
                  opt.indices = this.setIndexArray( 
                        opt.vertices.length, 
                        opt.primitive || Primitives.triangles
                  )
            }
            //get the number of vertices
            const N_OF_VERTICES = opt.indices.length;
            //create the index buffer
            const indexBuffer = this.createBuffer({
                  data: opt.indices,
                  dataType: BufferDataType.uint16,
                  label: 'index buffer',
                  usage: BufferUsage.index
            });


            let uniforms: UniformInformation | undefined;
            //if bindings locations exists, create uniforms
            if( data.bindings && data.bindings.length > 0 )
                  uniforms = this.initUniformsBuffers( 
                        pipeline, 
                        data.uniformStride, 
                        data.bindings!, 
                        opt.imageData, 
                        opt.bonesData?.bones || 0 
                  );

            
            return {
                  renderFunctionAttribs: {
                        pipeline,
                        vertexBuffer,
                        N_OF_VERTICES,
                        indexBuffer,
                        uniforms,
                  },
                  uniformsName: data.uniformsName,
            }
      }
      private initArrays( opt: DrawableElementAttributes ): RenderableArrays & { skeleton: Skeleton } {
            const bonesMatrix: number[] = [];
            const bones: Bone[] = [];
            //push identity matrix (non-transformation matrix)
            if( opt.bonesData ){
                  for( let i = 0; i < opt.bonesData.bones; i++ ){
                        bonesMatrix.push( ...Matrix.IDENTITY_4X4 );
                        bones.push({
                              inversePose: Matrix.IDENTITY_4X4,
                              transformationMatrix: Matrix.IDENTITY_4X4
                        })
                  }
            }
            return {
                  bones: bonesMatrix,
                  transformations: Matrix.IDENTITY_4X4,
                  //set the skeletal information
                  skeleton: {
                        root: opt.bonesData?.root || 0,
                        bones,
                        indices: opt.bonesData?.indices || []
                  }
            }
      }
      private setSkeleton( bones: Skeleton, opt: DrawOpt ): number[] {
            // new bone array
            const bonesArray: number[] = [];
            // check if skeleton will be updated with the new options
            if( !opt.bones || ( !opt.bones.angle && !opt.bones.translate ) ) 
                  return [];
            // check if one of the two transformations is undefined
            // and then set it to generically null transformation
            if( !opt.bones.translate ){
                  opt.bones.translate = []
                  // translate of (0,0,0)
                  for( let i = 0; i < opt.bones.angle!.length; i++ )
                        opt.bones.translate.push({ x: 0, y: 0, z: 0})
            }else if( !opt.bones.angle ){
                  opt.bones.angle = []
                  //rotate of angle 0
                  for( let i = 0; i < opt.bones.translate.length; i++ )
                        opt.bones.angle.push(0);
            }
            // calculate the skeleton matrix
            const bonesMatrices = this.view.calculateSkeletonPosition( bones, opt.bones.angle!, opt.bones.translate );
            // push the flattened skeleton matrix
            bonesArray.push( ...bonesMatrices.reduce( (prev, curr)=> prev? prev.concat( curr ): curr ) );
            return bonesArray;
      }
      private getArrays( bones: Skeleton, uniformsName: string[], opt: DrawOpt ): {
            uniformArray: number[],
            bonesArray: number[] } {
            //new uniform array
            const uniformArray: number[] = [];
            //map will be used to call the init functions depending on the uniforms Name
            const funcs: UniformsSetterFunction = {
                  [UN.perspective]: ()=>{
                        //push the perspective matrix
                        uniformArray.push( ...this.view.perspectiveMatrix );
                  },
                  [UN.transformation]: ()=>{
                        //push the transformation matrix
                        uniformArray.push( ...this.view.getTransformationMatrix( opt ) );
                  },
                  [UN.bumpScale]: ()=>{
                        //push the bump scale
                        //probably need to be aligned 
                        uniformArray.push( opt?.bumpScale || 1 );
                  },
                  [UN.framePosition]: ()=>{
                        //push the animation vector (set the frame and costume to create animations in textures)
                        uniformArray.push( ...( opt.animationVector || [ 0, 0 ] ) );
                        //webgpu align memory
                        uniformArray.push( 0,0 )
                  },
            } as const;
            //loop over the uniforms name linked to the program
            for( let name of uniformsName ){
                  funcs[name as UN]();
            }
            return {
                  uniformArray,
                  bonesArray: this.setSkeleton( bones, opt )
            };
      }
      private getMinZ( vertices: number[] ){
            //set the minimum z value to the first z value in the array
            let z = vertices[2]
            //search in the array for a z value less than the previous
            for( let i = 2; i < vertices.length; i+=3 ){
                  if( vertices[i] < z )
                        z = vertices[i]
            }
            //return the minimum value of z (the nearest to the camera)
            return z;
      }
      /**
       * @param opt Options for the model that will be created
       * @returns renderable object
       */
      create( opt: DrawableElementAttributes ): WebGPURenderable {
            //initialize arrays that will be used for uniforms
            const arrays = this.initArrays( opt );
            // get attributes of the program, such as rendering pipeline
            // create textures and attributes and uniforms buffers, create index buffer etc...
            const attribs = this.setProgramAttributes( opt );

            // if uniforms are used in the shader, write them in the buffer
            if( attribs.renderFunctionAttribs.uniforms && attribs.renderFunctionAttribs.uniforms.buffer ){
                  this.device?.queue.writeBuffer( 
                        attribs.renderFunctionAttribs.uniforms.buffer, 
                        0,  
                        new Float32Array( arrays.transformations ) );
            }
            // if skeletal animation is used in the shader, write data in the buffer
            if( attribs.renderFunctionAttribs.uniforms && attribs.renderFunctionAttribs.uniforms.boneBuffer ){
                  this.device?.queue.writeBuffer( 
                        attribs.renderFunctionAttribs.uniforms.boneBuffer, 
                        0,  
                        new Float32Array( arrays.bones ) );
            }
            // return the renderable object
            return {
                  //create a render function ( will be executed in the shader )
                  function: this.createRenderFunction({
                        pipeline: attribs.renderFunctionAttribs.pipeline,
                        vertexBuffer: attribs.renderFunctionAttribs.vertexBuffer,
                        N_OF_VERTICES: attribs.renderFunctionAttribs.N_OF_VERTICES,
                        indexBuffer: attribs.renderFunctionAttribs.indexBuffer,
                        uniformsBindGroup: attribs.renderFunctionAttribs.uniforms? 
                                    attribs.renderFunctionAttribs.uniforms.bindGroup:
                                    undefined
                  }),
                  //buffer used in shader
                  buffers: {
                        bones: attribs.renderFunctionAttribs.uniforms?.boneBuffer,
                        transformations: attribs.renderFunctionAttribs.uniforms?.buffer
                  },
                  //skeletal animation information
                  skeleton: arrays.skeleton,
                  //uniforms names => will be used to modify the arrays during rendering
                  uniformsName: attribs.uniformsName,
                  //attributes that are linked to a specific object
                  attributes: {},
                  //whether an object contains alpha channel or not
                  transparent: opt.imageData? true: false,
                  //used to sort the rendering array before rendering
                  z: this.getMinZ( opt.vertices )
            }
      }
      /**
       * 
       * @param name the id of the object => if already exists, it will be replaced
       * @param obj the renderable object
       * @returns Renderer
       */
      append( name: string, obj: WebGPURenderable ): this {
            this.objects.set( name, obj );
            // if the object is transparent, 
            // the objects need to be ordered at rendering time
            if( obj.transparent )
                  this.transparency = true;
            //set the attributes
            this.setAttributes( name, obj.attributes );
            return this;
      }
      /**
       * 
       * @param name the id of the object
       * @param attributes the attributes that will be set (will be merged with old attributes)
       * @returns Renderer
       */
      setAttributes( name: string, attributes: DrawOpt ): this {
            const obj = this.objects.get( name );
            //if the object doesn't exists, return
            if( !obj ){
                  console.warn(`object ${name} does not exist`);
                  return this;
            }
            if( !attributes ) 
                  return this;
            // merge the attributes
            obj.attributes = {
                  ...obj.attributes,
                  ...attributes
            }
            //get the new arrays
            const arrays = this.getArrays( obj.skeleton, obj.uniformsName, obj!.attributes );
            
            //write the uniform array on the uniform buffer
            if( arrays.uniformArray && obj.buffers.transformations ){
                  this.device?.queue.writeBuffer( obj.buffers.transformations!, 0,  new Float32Array( arrays.uniformArray ) );
            }

            //write the bones array on the bones buffer
            if( arrays.bonesArray && obj.buffers.bones ){
                  this.device?.queue.writeBuffer( obj.buffers.bones, 0,  new Float32Array( arrays.bonesArray ) );
            }

            return this;
      }
      /**
       * @param attributes attributes that wil be set to all objects
       * @returns Renderer
       */
      setToAll( attributes: DrawOpt ): this {
            //set to all the objects the attributes
            for( let el of this.objects.keys() ){
                  this.setAttributes( el, attributes );
            }
            return this;
      }
      /**
       * 
       * @param name id of the object
       * @returns Renderable or undefined if the object doesn't exist
       */
      remove( name: string ): WebGPURenderable | undefined {
            // check if the object exists
            if( !this.objects.has( name ) ){
                  console.warn(`object ${name} does not exist`);
                  return;
            }
            const obj = this.objects.get( name );
            //delete from the hashmap
            this.objects.delete( name );
            return obj;
      }
      /**
       * delete all the appended values
       */
      removeAll(): void {
            this.objects.clear();
            this.transparency = false;
      }
      private sortTransparent(): WebGPURenderable[] {
            const sorted: WebGPURenderable[] = [];
            const others: WebGPURenderable[] = [];
            //if there are no transparent objects
            // return the array
            if( !this.transparency ){
                  return [...this.objects.values()];
            }
            //sort the objects
            for( let el of this.objects.values() ){
                  //first, check if is transparent
                  if( !el.transparent ){
                        others.push( el );
                        continue;
                  }
                  let i;
                  // second-last element is the 15th element
                  const zTranslationTested = el.attributes.translationMatrix? el.attributes.translationMatrix![14]: 0;
                  for( i = 0; i < sorted.length ; i++ ){
                        // second-last element is the 15th element
                        // values to switch with
                        const zTranslationTemp = sorted[i].attributes.translationMatrix? sorted[i].attributes.translationMatrix![14]: 0;
                        if( sorted[i].z + zTranslationTemp > el.z + zTranslationTested ){
                              break;
                        }
                  }
                  // add the object to the array
                  sorted.splice( i , 0, el );
            }
            // return the objects
            return [ ...others, ...sorted ];
      }
      draw(): void {
            //first, sort the objects for transparency
            const objects = this.sortTransparent();

            // check if the renderPassDescriptor object is defined (should be always defined)
            if( !this.renderPassDescriptor ) 
                  return;
            // set the canvas view
            this.setRenderPassDescriptorView( this.renderPassDescriptor, true );
            //create the encoder
            const encoder = this.device?.createCommandEncoder();
            //check if the encoder is created
            if( !encoder ) 
                  return;
            //start writing the command buffer
            const pass = encoder.beginRenderPass( this.renderPassDescriptor );
            //loop over the different objects
            for( let el of objects )
                  //run the render function
                  el.function( pass )
            //end the writing of the command buffer
            pass.end()
            //draw
            this.device?.queue.submit( [encoder.finish()] );
      }
}
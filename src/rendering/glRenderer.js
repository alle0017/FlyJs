import { Axis, } from "./generics.js";
/**
 * WebGL Renderer Delegate class for handling WebGL operations.
 */
class GLRendererDelegate {
    /**
   * Creates a new GLRendererDelegate.
   * @param {WebGLRenderingContext | null} ctx - The WebGL rendering context.
   * @throws {Error} Throws an error if WebGL is not available.
   */
    constructor(ctx) {
        if (!ctx)
            throw new Error("WebGL not available");
        this.gl = ctx;
        this.ARRAY_BUFFER = this.gl.ARRAY_BUFFER;
        this.ELEMENT_ARRAY_BUFFER = this.gl.ELEMENT_ARRAY_BUFFER;
    }
    /**
     *
     * @param sourceCode the source code of the shader, must be a string
     * @param type can be gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
     * @returns WebGLShader or null if failed and console the error code if the shader creation failed
     */
    createShader(sourceCode, type) {
        const shader = this.gl.createShader(type);
        if (!shader) {
            console.error(this.gl.getError());
            this.gl.deleteShader(shader);
            return null;
        }
        this.gl.shaderSource(shader, sourceCode);
        this.gl.compileShader(shader);
        return shader;
    }
    /**
     *
     * @param vShader string or WebGLShader. The code of vertex shader
     * @param fShader string or WebGLShader. The code of fragment shader
     * @returns {WebGLProgram | null} returns null if the program creation failed.
     */
    createProgram(vShader, fShader) {
        const program = this.gl.createProgram();
        if (!program) {
            console.error(this.gl.getError());
            this.gl.deleteProgram(program);
            return null;
        }
        const vertexShader = typeof vShader == 'string' ? this.createShader(vShader, this.gl.VERTEX_SHADER) : vShader;
        if (!vertexShader) {
            return null;
        }
        this.gl.attachShader(program, vertexShader);
        const fragmentShader = typeof fShader == 'string' ? this.createShader(fShader, this.gl.FRAGMENT_SHADER) : fShader;
        if (!fragmentShader) {
            return null;
        }
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        this.gl.useProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }
    /**
     *
     * @param {TypedArray} data the data to fill the buffer with
     * @param type the type of the buffer (e.g. gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER)
     * @param numberOfComponents number between 1 and 4 that indicates number of components (default is 3)
     * @param staticDraw optional. if is true, the buffer is set to static usage, otherwise to dynamic (default to false)
     * @returns Buffer or null if the creation failed. initially, the location attribute is set to 0
     */
    createBuffer(data, type, staticDraw = false) {
        const buffer = this.gl.createBuffer();
        if (!buffer) {
            console.error(this.gl.getError());
            return null;
        }
        this.gl.bindBuffer(type, buffer);
        this.gl.bufferData(type, data, staticDraw ? this.gl.STATIC_DRAW : this.gl.DYNAMIC_DRAW);
        return buffer;
    }
    /**
    * Creates a WebGL texture from an image.
    * @param {HTMLImageElement} image - The image used to create the texture.
    * @returns {WebGLTexture | null} The created texture.
    */
    createTexture(image) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        // Fill the texture with a 1x1 blue pixel.
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
        // Now that the image has loaded make copy it to the texture.
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        //this.gl.generateMipmap(this.gl.TEXTURE_2D);
        return texture;
    }
    /**
    * Enables culling and depth test in WebGL.
    * @param {boolean} depthTest - If true, enables depth testing.
    */
    enableCulling(depthTest = true) {
        depthTest && this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.frontFace(this.gl.CCW);
        this.gl.cullFace(this.gl.BACK);
        this.gl.depthFunc(this.gl.LEQUAL);
    }
    /**
    *Resizes the WebGL canvas.
    * @param {number} width - The new width of the canvas.
    * @param {number} height - The new height of the canvas.
    */
    resizeCanvas(width, height) {
        this.gl.canvas.width = width;
        this.gl.canvas.height = height;
    }
    /**
    * Retrieves the uniform locations in a WebGL program.
    * @param {Uniform[]} uniforms - An array of uniform objects.
    * @param {WebGLProgram} program - The WebGL program.
    */
    getUniformLocation(uniforms, program) {
        for (let el of uniforms) {
            el.location = this.gl.getUniformLocation(program, el.name);
        }
    }
    /**
    * Retrieves the attribute locations in a WebGL program.
    * @param {Buffer[]} attributes - An array of buffer objects.
    * @param {WebGLProgram} program - The WebGL program.
    * @returns {Buffer[]} An array of buffers with assigned locations.
    */
    getAttribLocations(attributes, program) {
        for (let el of attributes) {
            el.location = this.gl.getAttribLocation(program, el.attributeName);
        }
        return attributes;
    }
    /**
    * Binds buffers for rendering in WebGL.
    * @param {Buffer[]} buffers - An array of buffer objects.
    */
    bindBuffers(buffers) {
        for (let bufferData of buffers) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.buffer);
            this.gl.enableVertexAttribArray(bufferData.location);
            this.gl.vertexAttribPointer(bufferData.location, bufferData.numberOfComponents, bufferData.type || this.gl.FLOAT, bufferData.normalize || false, bufferData.stride || 0, bufferData.offset || 0);
        }
    }
    /**
    * Binds an indices buffer for rendering in WebGL.
    * @param {WebGLBuffer} buffer - The WebGL buffer containing indices.
    */
    bindIndicesBuffer(buffer) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    }
    /**
    * Binds uniforms for rendering in WebGL.
    * @param {Uniform[]} uniforms - An array of uniform objects.
    */
    bindUniforms(uniforms) {
        for (let el of uniforms) {
            switch (el.type) {
                case GLRendererDelegate.TEXTURE:
                    {
                        this.gl.uniform1i(el.location, 0);
                    }
                    break;
                case GLRendererDelegate.MAT4:
                    {
                        if (typeof el.value == 'number' || !el.value)
                            break;
                        this.gl.uniformMatrix4fv(el.location, el.transpose, el.value);
                    }
                    break;
                case GLRendererDelegate.MAT3:
                    {
                        if (typeof el.value == 'number' || !el.value)
                            break;
                        this.gl.uniformMatrix3fv(el.location, el.transpose, el.value);
                    }
                    break;
                case GLRendererDelegate.FLOAT:
                    {
                        if (typeof el.value != 'number' || !el.value)
                            break;
                        this.gl.uniform1f(el.location, el.value);
                    }
                    break;
                case GLRendererDelegate.VEC4:
                    {
                        if (typeof el.value == 'number' || !el.value)
                            break;
                        this.gl.uniform4fv(el.location, el.value);
                    }
                    break;
                case GLRendererDelegate.VEC2: {
                    if (typeof el.value == 'number' || !el.value)
                        break;
                    this.gl.uniform2fv(el.location, el.value);
                }
            }
        }
    }
    /**
     *
     * @param color optional. The color to use to clear the screen
     */
    clear(color) {
        if (color) {
            this.gl.clearColor(color.r, color.g, color.b, color.a);
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BITS);
    }
    /**
    * Draws elements in WebGL.
    * @param {number} length - The number of elements to draw.
    */
    draw(length) {
        this.gl.drawElements(this.gl.TRIANGLES, length, this.gl.UNSIGNED_SHORT, 0);
    }
    /**
    * Sets the active WebGL program.
    * @param {WebGLProgram | null} program - The WebGL program to use.
    */
    useProgram(program) {
        this.gl.useProgram(program);
    }
}
// Constants for data types
GLRendererDelegate.axis = Axis;
GLRendererDelegate.MAT4 = 1;
GLRendererDelegate.TEXTURE = 2;
GLRendererDelegate.FLOAT = 3;
GLRendererDelegate.VEC4 = 4;
GLRendererDelegate.MAT3 = 5;
GLRendererDelegate.VEC2 = 6;
export { GLRendererDelegate };

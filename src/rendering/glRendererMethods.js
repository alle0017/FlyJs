import { Axis, } from "./generics.js";
class GLRendererDelegate {
    constructor(ctx) {
        if (!ctx)
            throw new Error("WebGL not available");
        this.gl = ctx;
        this.useProgram = this.gl.useProgram;
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
    enableCulling(depthTest = true) {
        depthTest && this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.frontFace(this.gl.CCW);
        this.gl.cullFace(this.gl.BACK);
        this.gl.depthFunc(this.gl.LEQUAL);
    }
    resizeCanvas(width, height) {
        this.gl.canvas.width = width;
        this.gl.canvas.height = height;
    }
    getUniformLocation(uniforms, program) {
        for (let el of uniforms) {
            el.location = this.gl.getUniformLocation(program, el.name);
        }
    }
    getAttribLocations(attributes, program) {
        for (let el of attributes) {
            el.location = this.gl.getAttribLocation(program, el.attributeName);
        }
        return attributes;
    }
    bindBuffers(buffers) {
        for (let bufferData of buffers) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferData.buffer);
            this.gl.enableVertexAttribArray(bufferData.location);
            this.gl.vertexAttribPointer(bufferData.location, bufferData.numberOfComponents, bufferData.type || this.gl.FLOAT, bufferData.normalize || false, bufferData.stride || 0, bufferData.offset || 0);
        }
    }
    bindIndicesBuffer(buffer) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    }
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
    draw(length) {
        this.gl.drawElements(this.gl.TRIANGLES, length, this.gl.UNSIGNED_SHORT, 0);
    }
    useProgram(program) { }
}
GLRendererDelegate.axis = Axis;
GLRendererDelegate.MAT4 = 1;
GLRendererDelegate.TEXTURE = 2;
GLRendererDelegate.FLOAT = 3;
GLRendererDelegate.VEC4 = 4;
GLRendererDelegate.MAT3 = 5;
GLRendererDelegate.VEC2 = 6;
export { GLRendererDelegate };

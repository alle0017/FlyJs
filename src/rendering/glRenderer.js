export class WebGLRenderer {
    constructor(gl) {
        this.gl = gl;
        this.TEXTURE = 2;
        this.VEC4 = 4;
        this.VEC2 = 6;
        this.MAT4 = 1;
        this.MAT3 = 5;
        this.BUFFER = this.gl.ARRAY_BUFFER;
        this.INDEX_BUFFER = this.gl.ELEMENT_ARRAY_BUFFER;
        this.FRAGMENT_SHADER = this.gl.FRAGMENT_SHADER;
        this.VERTEX_SHADER = this.gl.VERTEX_SHADER;
        this.FLOAT = this.gl.FLOAT;
        this.BYTE = this.gl.BYTE;
        this.SHORT = this.gl.SHORT;
        this.UNSIGNED_BYTE = this.gl.UNSIGNED_BYTE;
        this.UNSIGNED_SHORT = this.gl.UNSIGNED_SHORT;
    }
    attachShader(program, shaderCode, type) {
        const shader = this.createShader(shaderCode, type);
        if (!shader) {
            throw 'something went wrong with vertex shader creation ' + shaderCode;
        }
        this.gl.attachShader(program, shader);
    }
    initProgram(vShader, fShader) {
        const program = this.gl.createProgram();
        if (!program) {
            console.error(this.gl.getError());
            this.gl.deleteProgram(program);
            throw 'something went wrong with program creation';
        }
        this.attachShader(program, vShader, this.VERTEX_SHADER);
        this.attachShader(program, fShader, this.FRAGMENT_SHADER);
        return program;
    }
    createBuffer(data, type = this.BUFFER, staticDraw = false) {
        if (type !== this.INDEX_BUFFER && type !== this.BUFFER) {
            throw 'non valid type for buffer creation';
        }
        const buffer = this.gl.createBuffer();
        if (!buffer) {
            console.error(this.gl.getError());
            this.gl.deleteBuffer(buffer);
            throw 'something went wrong with buffer creation';
        }
        this.gl.bindBuffer(type, buffer);
        this.gl.bufferData(type, data, staticDraw ? this.gl.STATIC_DRAW : this.gl.DYNAMIC_DRAW);
        return buffer;
    }
    createProgram(vShader, fShader) {
        const program = this.initProgram(vShader, fShader);
        this.gl.linkProgram(program);
        this.gl.useProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(program));
            throw 'something went wrong with program creation';
        }
        return program;
    }
    createShader(sourceCode, type) {
        const shader = this.gl.createShader(type);
        if (!shader) {
            console.error(this.gl.getError());
            this.gl.deleteShader(shader);
            throw 'something went wrong with shader creation';
        }
        this.gl.shaderSource(shader, sourceCode);
        this.gl.compileShader(shader);
        return shader;
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
        if (!texture) {
            throw 'something went wrong creating texture ' + image;
        }
        return texture;
    }
    getUniformLocation(uniform, program) {
        const location = this.gl.getUniformLocation(program, uniform);
        if (!location)
            throw 'something went wrong getting the uniform location ' + uniform;
        return location;
    }
    getAttributeLocation(attribute, program) {
        return this.gl.getAttribLocation(program, attribute);
    }
    bindAndEnableBuffer(bufferData) {
        this.bindBuffer(bufferData);
        this.gl.enableVertexAttribArray(bufferData.location);
        this.gl.vertexAttribPointer(bufferData.location, bufferData.numberOfComponents, bufferData.dataType, bufferData.normalize, bufferData.stride, bufferData.offset);
    }
    bindBuffer(bufferData) {
        const typeOfBuffer = bufferData.indices ? this.INDEX_BUFFER : this.BUFFER;
        this.gl.bindBuffer(typeOfBuffer, bufferData.buffer);
    }
    bindUniform(uniform) {
        switch (uniform.dataType) {
            case this.TEXTURE:
                {
                    this.gl.uniform1i(uniform.location, 0);
                }
                break;
            case this.MAT4:
                {
                    if (typeof uniform.value == 'number' || !uniform.value)
                        break;
                    this.gl.uniformMatrix4fv(uniform.location, uniform.transpose, uniform.value);
                }
                break;
            case this.MAT3:
                {
                    if (typeof uniform.value == 'number' || !uniform.value)
                        break;
                    this.gl.uniformMatrix3fv(uniform.location, uniform.transpose, uniform.value);
                }
                break;
            case this.FLOAT:
                {
                    if (typeof uniform.value != 'number' || !uniform.value)
                        break;
                    this.gl.uniform1f(uniform.location, uniform.value);
                }
                break;
            case this.VEC4:
                {
                    if (typeof uniform.value == 'number' || !uniform.value)
                        break;
                    this.gl.uniform4fv(uniform.location, uniform.value);
                }
                break;
            case this.VEC2: {
                if (typeof uniform.value == 'number' || !uniform.value)
                    break;
                this.gl.uniform2fv(uniform.location, uniform.value);
            }
        }
    }
    clear(color) {
        if (color) {
            this.gl.clearColor(color.r, color.g, color.b, color.a);
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BITS);
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
    draw(vertexCount) {
        this.gl.drawElements(this.gl.TRIANGLES, vertexCount, this.gl.UNSIGNED_SHORT, 0);
    }
    useProgram(program) {
        this.gl.useProgram(program);
    }
}

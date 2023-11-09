var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { WebGLShader } from "./GLShaders.js";
import { WebGPUShader } from "./GPUShader.js";
import { WebGPURenderer } from "./GPURenderer.js";
import { WebGLRenderer } from "./GLRenderer.js";
function rendererFallback(constructor) {
    if (navigator.gpu)
        return constructor;
    constructor.prototype = WebGLRenderer;
    return class extends constructor {
        constructor() {
            super(...arguments);
            this.Shader = WebGLShader;
        }
    };
}
let Renderer = 
/**
*
* @hideconstructor
*/
class Renderer extends WebGPURenderer {
    constructor() {
        super(...arguments);
        this.Shader = WebGPUShader;
    }
    setUpImageShader(shader, opt) {
        if (!opt.image)
            return;
        shader.useTexture();
        if (opt.animate)
            shader.useAnimation2D();
        if (opt.displacementMap)
            shader.useDisplacementMap();
        return;
    }
    setUpColorShader(shader, opt) {
        if (opt.staticColor)
            shader.useUniformColor(opt.staticColor.r, opt.staticColor.g, opt.staticColor.b, opt.staticColor.a);
        if (opt.color)
            shader.useInterpolatedColor();
    }
    setupShaders(opt) {
        const shader = new this.Shader();
        this.setUpColorShader(shader, opt);
        this.setUpImageShader(shader, opt);
        if (!opt.static)
            shader.useDynamicElement();
        if (opt.perspective)
            shader.usePerspective();
        return shader;
    }
    getDrawFunction(opt) {
        const shaderInfos = this.setupShaders(opt);
        return () => {
        };
    }
};
Renderer = __decorate([
    rendererFallback
    /**
    *
    * @hideconstructor
    */
], Renderer);
export { Renderer };

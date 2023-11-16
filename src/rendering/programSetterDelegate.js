import * as Types from './types.js';
import { WebGPUShader as GPU } from './shaders/GPUShader.js';
import { WebGLShader as GL } from './shaders/GLShaders.js';
import { AttributesName as AN } from './shaders/shaderModel.js';
export class ProgramSetterDelegate {
    constructor() { }
    static elaborateData(data, attributes, 
    //uniforms:  Map<string, number[]>, 
    infos) {
        if (data.staticColor) {
            const c = data.staticColor;
            infos.useUniformColor(c.r, c.g, c.b, c.a);
        }
        if (data.color) {
            infos.useInterpolatedColor();
            attributes.set(AN.color, data.color);
        }
        if (data.imageData) {
            this.elaborateImageData(data.imageData, infos);
        }
        if (data.perspective) {
            infos.usePerspective();
            //uniforms.set( UN.perspective, [] );
        }
        if (!data.static) {
            infos.useDynamicElement();
            //uniforms.set( UN.transformation, [] );
        }
    }
    static elaborateImageData(opt, infos) {
        infos.useTexture();
        if (opt.displacementMap) {
            infos.useDisplacementMap();
        }
        if (opt.animate) {
            infos.useAnimation2D();
        }
    }
    static unifyVertexBuffers(attributes, infos) {
        const attributesData = infos.get().attributes;
        const length = attributes.get(AN.vertex).length / 3;
        const buffer = [];
        for (let i = 0; i < length; i++) {
            for (let [key, data] of attributesData.entries()) {
                const el = attributes.get(key);
                if (!el)
                    continue;
                buffer.push(...el.slice(i * data.components, (i + 1) * data.components));
            }
        }
        return buffer;
    }
    static getProperties(data, mode, unifyBuffer = true) {
        const infos = mode === Types.ProgramMode.webgpu ? new GPU() : new GL();
        const attributes = new Map();
        this.elaborateData(data, attributes, infos);
        attributes.set(AN.vertex, data.vertices);
        return Object.assign(Object.assign({}, infos.get()), { attributesData: attributes, unifiedAttributeBuffer: unifyBuffer ? this.unifyVertexBuffers(attributes, infos) : [] });
    }
}

export class WebGPURenderer {
    constructor(cvs) {
        this.device = undefined;
        this.adapter = undefined;
        this.ctx = cvs.getContext('webgpu');
        if (!this.ctx) {
            throw 'fallback to webgl';
        }
    }
    static async new(cvs) {
        var _a, _b, _c;
        const renderer = new WebGPURenderer(cvs);
        renderer.adapter = await ((_a = navigator.gpu) === null || _a === void 0 ? void 0 : _a.requestAdapter());
        renderer.device = await ((_b = renderer.adapter) === null || _b === void 0 ? void 0 : _b.requestDevice());
        if (navigator.gpu
            && 'getPreferredCanvasFormat' in navigator.gpu
            && 'configure' in renderer.ctx) {
            //TODO: refactor this part and make it more simple when types will be integrated in vscode.
            const canvasFormat = ((_c = navigator.gpu) === null || _c === void 0 ? void 0 : _c.getPreferredCanvasFormat)();
            renderer.ctx.configure({
                device: renderer.device,
                format: canvasFormat,
            });
        }
        return renderer;
    }
}

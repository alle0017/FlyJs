// 📈 Position Vertex Buffer Data
const positions = new Float32Array([
    1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0
]);
// 🎨 Color Vertex Buffer Data
const colors = new Float32Array([
    1.0,
    0.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    0.0,
    1.0 // 🔵
]);
// 📇 Index Buffer Data
const indices = new Uint16Array([0, 1, 2]);
export default class Renderer {
    constructor(canvas) {
        this.render = () => {
            // ⏭ Acquire next image from context
            this.colorTexture = this.context.getCurrentTexture();
            this.colorTextureView = this.colorTexture.createView();
            // 📦 Write and submit commands to queue
            this.encodeCommands();
            // ➿ Refresh canvas
            requestAnimationFrame(this.render);
        };
        this.canvas = canvas;
    }
    // 🏎️ Start the rendering engine
    async start() {
        if (await this.initializeAPI()) {
            this.resizeBackings();
            await this.initializeResources();
            this.render();
        }
    }
    // 🌟 Initialize WebGPU
    async initializeAPI() {
        try {
            // 🏭 Entry to WebGPU
            const entry = navigator.gpu;
            if (!entry) {
                return false;
            }
            // 🔌 Physical Device Adapter
            this.adapter = await entry.requestAdapter();
            // 💻 Logical Device
            this.device = await this.adapter.requestDevice();
            // 📦 Queue
            this.queue = this.device.queue;
        }
        catch (e) {
            console.error(e);
            return false;
        }
        return true;
    }
    // 🍱 Initialize resources to render triangle (buffers, shaders, pipeline)
    async initializeResources() {
        // 🔺 Buffers
        const createBuffer = (arr, usage) => {
            // 📏 Align to 4 bytes (thanks @chrimsonite)
            let desc = {
                size: (arr.byteLength + 3) & ~3,
                usage,
                mappedAtCreation: true
            };
            let buffer = this.device.createBuffer(desc);
            const writeArray = arr instanceof Uint16Array
                ? new Uint16Array(buffer.getMappedRange())
                : new Float32Array(buffer.getMappedRange());
            writeArray.set(arr);
            buffer.unmap();
            return buffer;
        };
        this.positionBuffer = createBuffer(positions, GPUBufferUsage.VERTEX);
        this.colorBuffer = createBuffer(colors, GPUBufferUsage.VERTEX);
        this.indexBuffer = createBuffer(indices, GPUBufferUsage.INDEX);
        // 🖍️ Shaders
        const vsmDesc = {
            code: vertShaderCode
        };
        this.vertModule = this.device.createShaderModule(vsmDesc);
        const fsmDesc = {
            code: fragShaderCode
        };
        this.fragModule = this.device.createShaderModule(fsmDesc);
        // ⚗️ Graphics Pipeline
        // 🔣 Input Assembly
        const positionAttribDesc = {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3'
        };
        const colorAttribDesc = {
            shaderLocation: 1,
            offset: 0,
            format: 'float32x3'
        };
        const positionBufferDesc = {
            attributes: [positionAttribDesc],
            arrayStride: 4 * 3,
            stepMode: 'vertex'
        };
        const colorBufferDesc = {
            attributes: [colorAttribDesc],
            arrayStride: 4 * 3,
            stepMode: 'vertex'
        };
        // 🌑 Depth
        const depthStencil = {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus-stencil8'
        };
        // 🦄 Uniform Data
        const pipelineLayoutDesc = { bindGroupLayouts: [] };
        const layout = this.device.createPipelineLayout(pipelineLayoutDesc);
        // 🎭 Shader Stages
        const vertex = {
            module: this.vertModule,
            entryPoint: 'main',
            buffers: [positionBufferDesc, colorBufferDesc]
        };
        // 🌀 Color/Blend State
        const colorState = {
            format: 'bgra8unorm'
        };
        const fragment = {
            module: this.fragModule,
            entryPoint: 'main',
            targets: [colorState]
        };
        // 🟨 Rasterization
        const primitive = {
            frontFace: 'cw',
            cullMode: 'none',
            topology: 'triangle-list'
        };
        const pipelineDesc = {
            layout,
            vertex,
            fragment,
            primitive,
            depthStencil
        };
        this.pipeline = this.device.createRenderPipeline(pipelineDesc);
    }
    // ↙️ Resize swapchain, frame buffer attachments
    resizeBackings() {
        // ⛓️ Swapchain
        if (!this.context) {
            this.context = this.canvas.getContext('webgpu');
            const canvasConfig = {
                device: this.device,
                format: 'bgra8unorm',
                usage: GPUTextureUsage.RENDER_ATTACHMENT |
                    GPUTextureUsage.COPY_SRC,
                alphaMode: 'opaque'
            };
            this.context.configure(canvasConfig);
        }
        const depthTextureDesc = {
            size: [this.canvas.width, this.canvas.height, 1],
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        };
        this.depthTexture = this.device.createTexture(depthTextureDesc);
        this.depthTextureView = this.depthTexture.createView();
    }
    // ✍️ Write commands to send to the GPU
    encodeCommands() {
        let colorAttachment = {
            view: this.colorTextureView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store'
        };
        const depthAttachment = {
            view: this.depthTextureView,
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store'
        };
        const renderPassDesc = {
            colorAttachments: [colorAttachment],
            depthStencilAttachment: depthAttachment
        };
        this.commandEncoder = this.device.createCommandEncoder();
        // 🖌️ Encode drawing commands
        this.passEncoder = this.commandEncoder.beginRenderPass(renderPassDesc);
        this.passEncoder.setPipeline(this.pipeline);
        this.passEncoder.setViewport(0, 0, this.canvas.width, this.canvas.height, 0, 1);
        this.passEncoder.setScissorRect(0, 0, this.canvas.width, this.canvas.height);
        this.passEncoder.setVertexBuffer(0, this.positionBuffer);
        this.passEncoder.setVertexBuffer(1, this.colorBuffer);
        this.passEncoder.setIndexBuffer(this.indexBuffer, 'uint16');
        this.passEncoder.drawIndexed(3, 1);
        this.passEncoder.end();
        this.queue.submit([this.commandEncoder.finish()]);
    }
}

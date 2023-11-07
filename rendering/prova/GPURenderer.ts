export class WebGPURenderer {
      protected device: GPUDevice | undefined = undefined;
      protected adapter: GPUAdapter | undefined = undefined;
      protected ctx: GPUCanvasContext;

      constructor( cvs: HTMLCanvasElement ) {
            this.ctx = cvs.getContext('webgpu') as unknown as GPUCanvasContext;
            if( !this.ctx ){
                  throw 'fallback to webgl'
            }
      }

      static async new( cvs: HTMLCanvasElement ): Promise<WebGPURenderer> {
            const renderer = new WebGPURenderer( cvs );
            renderer.adapter = await navigator.gpu?.requestAdapter();
            renderer.device = await renderer.adapter?.requestDevice();
            if(
                  navigator.gpu 
                  && 'getPreferredCanvasFormat' in navigator.gpu 
                  && 'configure' in renderer.ctx
                  ){
            //TODO: refactor this part and make it more simple when types will be integrated in vscode.
                  const canvasFormat = (navigator.gpu?.getPreferredCanvasFormat as (()=>any))();
                  (renderer.ctx.configure as ((arg0: any)=>void)) ({
                  device: renderer.device,
                  format: canvasFormat,
                  }) 
            }
            return renderer;
      }


}
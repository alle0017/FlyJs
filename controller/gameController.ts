import { Renderer as WebGLRenderer } from '../rendering/GLRenderer.js'
import { Renderer as WebGPURenderer } from '../rendering/GPURenderer.js';
import { DrawableElementAttributes, RenderFunction, DrawOpt, Color,  } from '../rendering/types.js';

interface Renderer {
      clearColor: Color;
      culling: boolean;
      init(): Promise<Renderer>;
      create( opt: DrawableElementAttributes ): RenderFunction;
      append( name: string, func: RenderFunction ): Renderer;
      remove( name: string ): RenderFunction | undefined;
      setAttributes( name: string, attributes: DrawOpt ): Renderer;
      draw(): void;
}
export class GameController {
      private static game: GameController;
      readonly renderer: Renderer;
      cvs: HTMLCanvasElement;
      private constructor(){
            this.cvs = document.createElement('canvas') as HTMLCanvasElement;
            if( !this.cvs )
                  throw 'canvas cannot be created';
            this.cvs.width = 800;
            this.cvs.height = 600;
            document.body.appendChild( this.cvs );
            if( 'gpu' in navigator )
                  this.renderer = new WebGPURenderer( this.cvs );
            else
                  this.renderer = new WebGLRenderer( this.cvs );
      }
      static async get(): Promise<GameController> {
            if( !GameController.game ){
                  GameController.game = new GameController();
                  await GameController.game.renderer.init();
            }
            return GameController.game;
      }
      start(): void {
            const worker = new Worker('./gameController.js');
      }
}
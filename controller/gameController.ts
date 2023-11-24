import { WebGLRenderer } from '../rendering/GLRenderer.js'
import { WebGPURenderer } from '../rendering/GPURenderer.js';
import { DrawableElementAttributes, RenderFunction, DrawOpt, Color, Renderable } from '../rendering/types.js';
import { Debug } from './debug.js';
import { LoopController } from './loopController.js';

// TODO: add instanceOnGPU method => call the RenderFunction one time and pass the encoder
interface Renderer {
      clearColor: Color;
      culling: boolean;
      init(): Promise<Renderer>;
      create( opt: DrawableElementAttributes ): any;
      append( name: string, obj: Renderable ): Renderer;
      remove( name: string ): Renderable | undefined;
      setAttributes( name: string, attributes: DrawOpt ): Renderer;
      setToAll( attributes: DrawOpt ): Renderer;
      draw(): void;
}
export class GameController {
      private static game: GameController;
      readonly $renderer: Renderer;
      readonly $LoopController: LoopController;
      readonly $debug: Debug;
      cvs: HTMLCanvasElement;
      private constructor(){
            this.cvs = document.createElement('canvas') as HTMLCanvasElement;
            if( !this.cvs )
                  throw 'canvas cannot be created';
            this.cvs.width = 800;
            this.cvs.height = 600;
            document.body.appendChild( this.cvs );
            if( 'gpu' in navigator )
                  this.$renderer = new WebGPURenderer( this.cvs );
            else
                  this.$renderer = new WebGLRenderer( this.cvs );
            this.$debug = new Debug( this );
            this.$LoopController = new LoopController();
      }
      static async get(): Promise<GameController> {
            if( !GameController.game ){
                  GameController.game = new GameController();
                  await GameController.game.$renderer.init();
            }
            return GameController.game;
      }
      start(): void {
            const worker = new Worker('./gameController.js');
      }
}
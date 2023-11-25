import { WebGLRenderer } from '../rendering/GLRenderer.js'
import { WebGPURenderer } from '../rendering/GPURenderer.js';
import { DrawableElementAttributes, DrawOpt, Color, Renderable } from '../rendering/types.js';
import { Debug } from './debug.js';
import { LoopController, } from './loopController.js';
import { Scene } from './scene.js';

export type Assets = {
      images: {
            [key: string]: ImageBitmap;
      },
      renderable: {
            [key: string]: Renderable;
      }
      scenes: {
            [key: string]: Scene;
      }
}
export type References = { 
      [key: string]: any;
}
// TODO: add instanceOnGPU method => call the RenderFunction one time and pass the encoder
interface Renderer {
      clearColor: Color;
      culling: boolean;
      init(): Promise<Renderer>;
      create( opt: DrawableElementAttributes ): Renderable;
      append( name: string, obj: Renderable ): Renderer;
      remove( name: string ): Renderable | undefined;
      removeAll(): void;
      setAttributes( name: string, attributes: DrawOpt ): Renderer;
      setToAll( attributes: DrawOpt ): Renderer;
      draw(): void;
}
export class GameController {
      private static game: GameController;
      private readonly $loopController: LoopController;
      readonly $renderer: Renderer;
      readonly $debug: Debug;
      readonly $assets: Assets = { 
            images: {},
            renderable: {},
            scenes: {},
      };
      readonly $refs: References = {};
      readonly cvs: HTMLCanvasElement;
      private _scene?: Scene;
      get $scene(): Scene | undefined {
            return this._scene;
      }
      set $scene( scene: Scene | undefined ){
            console.warn( 'the scene can be set only with useScene method' );
      }

      get $scenes(){
            return this.$assets.scenes;
      }
      set $scenes( scene: {
            [key: string]: Scene;
      } ){}

      get $images(){
            return this.$assets.images;
      }
      set $images( images: {
            [key: string]: ImageBitmap;
      }){}

      get $renderable(){
            return this.$assets.renderable;
      }
      set $renderable( renderable: {
            [key: string]: Renderable;
      }){}

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
            this.$loopController = new LoopController();
            this.$loopController.execute();
      }
      static async get(): Promise<GameController> {
            if( !GameController.game ){
                  GameController.game = new GameController();
                  await GameController.game.$renderer.init();
            }
            return GameController.game;
      }
      useScene( scene: Scene ): void {
            if( this._scene ){
                  this._scene.dismiss( GameController.game );
            }
            this.$renderer.removeAll();
            const { functions, objects } = scene.use( GameController.game );
            objects.forEach( (object,key)=> this.$renderer.append( key, object ) );
            this.$loopController.removeAll();
            functions.forEach( fn => this.$loopController.add( fn ) );
            this._scene = scene;
      }
      createScene(){
            return new Scene();
      }
}
import { WebGLRenderer } from '../rendering/GLRenderer.js'
import { WebGPURenderer } from '../rendering/GPURenderer.js';
import { DrawableElementAttributes, DrawOpt, Color, Renderable } from '../rendering/types.js';
import { Debug } from './debug.js';
import { LoopController, } from './loopController.js';
import { Scene } from './scene.js';
import { CustomScene } from './customScene.js';
import { EventEmitter } from './eventController.js';

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
      readonly loopController: LoopController;
      readonly renderer: Renderer;
      readonly debug: Debug;
      readonly events = EventEmitter;
      readonly assets: Assets = { 
            images: {},
            renderable: {},
            scenes: {},
      };
      readonly refs: References = {};
      readonly cvs: HTMLCanvasElement;
      private _scene?: Scene;
      get scene(): Scene | undefined {
            return this._scene;
      }
      set scene( scene: Scene | undefined ){
            console.warn( 'the scene can be set only with useScene method' );
      }

      get scenes(){
            return this.assets.scenes;
      }
      set scenes( scene: {
            [key: string]: Scene;
      } ){}

      get images(){
            return this.assets.images;
      }
      set images( images: {
            [key: string]: ImageBitmap;
      }){}

      get renderable(){
            return this.assets.renderable;
      }
      set renderable( renderable: {
            [key: string]: Renderable;
      }){}

      private constructor(){
            this.cvs = document.createElement('canvas') as HTMLCanvasElement;
            if( !this.cvs )
                  throw 'canvas cannot be created';
            this.cvs.width = 800;
            this.cvs.height = 600;
            document.body.appendChild( this.cvs );
            if( 'gpu' in navigator ){
                  this.renderer = new WebGPURenderer( this.cvs );
                  console.log('%cgpu enabled', 'color: #ff9933')
            }else{
                  this.renderer = new WebGLRenderer( this.cvs );
                  console.log('%cgl enabled', 'color: #9999ff')
            }
            this.debug = new Debug( this );
            this.loopController = new LoopController();
            this.loopController.execute();
            this.setEvents();
      }
      static async get(): Promise<GameController> {
            if( !GameController.game ){
                  GameController.game = new GameController();
                  await GameController.game.renderer.init();
            }
            return GameController.game;
      }
      private setEvents(){
            window.addEventListener('keydown', (e)=> this.events.fire(e.key, { game: this } ) );
      }
      useScene( scene: new (...args: any)=>CustomScene ): void;

      useScene( scene: Scene ): void;

      useScene( arg0: any ){

            if( this._scene ){
                  this._scene.dismiss();
            }
            this.renderer.removeAll();
            this.loopController.removeAll();
            if( arg0 instanceof Scene ){
                  arg0.use();
                  this._scene = arg0;
            }else{
                  const scene = new arg0(this);
                  scene.use()
                  this._scene = scene;
            }
      }

      createScene(){
            return new Scene( this );
      }
}
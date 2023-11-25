import { LoopController, LoopedFunction } from './loopController.js';
import { DrawOpt, Renderable } from '../rendering/types.js';
import { EventEmitter, EventHandler } from './eventController.js';
import { GameController } from './gameController.js';

export class Scene {
      private static SCENE_ID = 0;
      private id: number;
      private objects: Map<string,Renderable> = new Map<string,Renderable>();
      private functions: LoopedFunction[] = [];
      constructor(){
            this.id = Scene.SCENE_ID;
            Scene.SCENE_ID++;
      }
      use( game: GameController ){
            EventEmitter.fire( `scene_${this.id}_enter`, { game } );
            return {
                  functions: [...this.functions],
                  objects: this.objects
            }
      }
      dismiss( game: GameController ){
            EventEmitter.fire( `scene_${this.id}_dismiss`, {} );
      }
      attach( name: string, object: Renderable, attributes?: DrawOpt ){
            this.objects.set( name, object );
            if( attributes )
                  object.attributes = attributes;
      }
      execute( fn: LoopedFunction ){
            this.functions.push( fn );
      }
      onEnter( func: EventHandler ){
            EventEmitter.on( `scene_${this.id}_enter`, func );
      }
      onDismiss( func: EventHandler ){
            EventEmitter.on( `scene_${this.id}_dismiss`, func );
      }
}
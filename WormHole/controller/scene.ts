import { LoopController, LoopedFunction } from './loopController.js';
import { DrawOpt, Renderable } from '../rendering/types.js';
import { EventEmitter, EventHandler } from './eventController.js';
import { GameController } from './gameController.js';
import { Entity } from '../entities/entity.js';

export class Scene {
      private static SCENE_ID = 0;
      protected id: number;
      protected objects: Map<string,Renderable | Entity> = new Map<string,Renderable | Entity>();
      private functions: LoopedFunction[] = [];
      constructor(){
            this.id = Scene.SCENE_ID;
            Scene.SCENE_ID++;
      }
      use( game: GameController ){
            EventEmitter.fire( `scene_${this.id}_enter`, { game } );
            this.objects.forEach( (object,key)=>{ 
                  if( object instanceof Entity ){
                        game.renderer.append( key, object.renderable ) 
                        object.appended = true;
                  }else{
                        game.renderer.append( key, object )
                  }
            });
            this.functions.forEach( fn => game.loopController.add( fn ) );
      }
      dismiss( game: GameController ){
            EventEmitter.fire( `scene_${this.id}_dismiss`, { game } );
            this.objects.forEach( object => { 
                  if( object instanceof Entity )
                        object.appended = false;
            });
      }
      attach( name: string, object: Renderable, attributes?: DrawOpt ): void;
      attach( entity: Entity, attributes?: DrawOpt ): void;
      attach( arg0: any, arg1: any, arg2?: any ){
            if( arg0 instanceof Entity ){
                  this.objects.set( arg0.id, arg0.renderable );
                  if( arg1 )
                        arg0.renderable.attributes = arg1;
            }
            else{
                  this.objects.set( arg0, arg1 );
                  if( arg2 )
                        arg1.attributes = arg2;
            }
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
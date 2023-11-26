import { GameController } from "./gameController.js";
import { EventEmitter } from "./eventController.js";
import { Scene } from "./scene.js";
import { Entity } from "../entities/entity.js";

export const game = await GameController.get();

export abstract class CustomScene extends Scene {
      protected readonly $game;
      protected readonly $renderer;
      protected readonly $assets;
      protected readonly $debug;
      protected readonly $events;

      constructor(){
            super();
            this.$game = game;
            this.$renderer = game.renderer;
            this.$assets = game.assets;
            this.$debug = game.debug;
            this.$events = EventEmitter;
      }

      override use( game: GameController ){
            this.onCreate( game );
            EventEmitter.fire( `scene_${this.id}_enter`, { game } );
            this.objects.forEach( (object,key)=>{ 
                  if( object instanceof Entity ){
                        game.renderer.append( key, object.renderable ) 
                        object.appended = true;
                  }else{
                        game.renderer.append( key, object )
                  }
            });
            game.loopController.add( (this.update).bind(this) );
      }
      override dismiss( game: GameController ){
            super.dismiss( game );
            this.onDestroyed( game );
      }
      abstract update(): void;
      abstract onCreate( game: GameController ): void;
      abstract onDestroyed( game: GameController ): void;

}
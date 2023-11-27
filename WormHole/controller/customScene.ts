import { GameController } from "./gameController.js";
import { EventEmitter } from "./eventController.js";
import { Scene } from "./scene.js";
import { Entity } from "../entities/entity.js";

export abstract class CustomScene extends Scene {

      protected readonly $renderer;
      protected readonly $assets;
      protected readonly $debug;
      protected readonly $events;

      constructor( game: GameController ){
            super( game );
            this.$renderer = game.renderer;
            this.$assets = game.assets;
            this.$debug = game.debug;
            this.$events = EventEmitter;
      }

      override use(){
            this.onCreate( this.$game );
            super.use();
            this.$game.loopController.add( (this.update).bind(this) );
      }
      override dismiss(){
            super.dismiss();
            this.onDestroyed( this.$game );
      }
      abstract update(): void;
      abstract onCreate( game: GameController ): void;
      abstract onDestroyed( game: GameController ): void;

}
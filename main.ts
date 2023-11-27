import { GameController } from './WormHole/controller/gameController.js';
import { Types, WormHoleScene, game, WormHoleSprite2D, Load, bug, Shapes } from './WormHole/wormHole.js';


const color =  [
      
      1.0, 0.0, 0.0, 1.0, // Front face: white
      1.0, 1.0, 0.0, 1.0,
      1.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 0.0, 1.0,

      1.0, 0.0, 0.0, 1.0, // Back face: red
      1.0, 0.1, 0.0, 1.0,
      1.0, 0.0, 0.5, 1.0,
      1.0, 0.0, 0.0, 1.0,

      1.0, 1.0, 0.0, 1.0, // Top face: green
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.1, 0.0, 1.0,
      0.0, 1.0, 1.0, 1.0,

      0.0, 0.0, 1.0, 1.0, // Bottom face: blue
      0.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,

      1.0, 1.0, 0.0, 1.0, // Right face: yellow
      1.0, 1.0, 0.5, 1.0,
      1.0, 1.0, 1, 1.0,
      1.0, 1.0, 0.0, 1.0,

      1.0, 0.0, 1.0, 1.0, 
      1.0, 1.0, 1.0, 1.0, 
      1.0, 0.4, 1.0, 1.0, 
      0.0, 0.3, 1.0, 1.0, 
]
const vertices = [
      0,  1, 0,  // 0
      0, -1, 0, // 1
      2,  1, 0,  // 2
      2, -1, 0,  // 3
      4,  1, 0,  // 4
      4, -1, 0,  // 5
      6,  1, 0,  // 6
      6, -1, 0,  // 7
      8,  1, 0,  // 8
      8, -1, 0,  // 9
]
const boneIndex = [
      0, 0, 0, 0,  // 0
      0, 0, 0, 0,  // 1
      0, 1, 0, 0,  // 2
      0, 1, 0, 0,  // 3
      1, 0, 0, 0,  // 4
      1, 0, 0, 0,  // 5
      1, 2, 0, 0,  // 6
      1, 2, 0, 0,  // 7
      2, 0, 0, 0,  // 8
      2, 0, 0, 0,  // 9
]
const weights = [
      1, 0, 0, 0,  // 0
      1, 0, 0, 0,  // 1
     .5,.5, 0, 0,  // 2
     .5,.5, 0, 0,  // 3
      1, 0, 0, 0,  // 4
      1, 0, 0, 0,  // 5
     .5,.5, 0, 0,  // 6
     .5,.5, 0, 0,  // 7
      1, 0, 0, 0,  // 8
      1, 0, 0, 0,  // 9
     ];
const indices = [
      0, 1,
      0, 2,
      1, 3,
      2, 3, //
      2, 4,
      3, 5,
      4, 5,
      4, 6,
      5, 7, //
      6, 7,
      6, 8,
      7, 9,
      8, 9,
    ];
game.assets.images.img = await Load.image('./otherStuff/prova.png')
class mySprite extends WormHoleSprite2D {
      private time = 600;
      private nextFrameTime = 60;
      constructor(){
            super({ 
                  image: game.assets.images.img,
                  frames: 4,
                  costumes: 4, 
            });
      }

      onDraw(): void {
            this.animate( this.game.loopController.timeFromStart )
      }
      onDismiss(): void {
            throw new Error('Method not implemented.');
      }
      onEnter(): void {
            bug();
            this.game.refs.costumes = 0;
            this.costume = 3
      }
      animate( delta: number ){
            if( delta < this.nextFrameTime ) return;
            this.nextFrameTime = delta + this.time;
            this.frame = this.game.refs.costumes;
            this.game.refs.costumes ++;
            if( this.game.refs.costumes >= this.costumes )
                  this.game.refs.costumes = 0
      }
      
}
class FirstScene extends WormHoleScene {
      update(){
            this.$renderer.draw();
      }
      onCreate(game: GameController): void {

            this.$game.refs.i = 0;
            //setup debug camera
            this.$debug.globalCamera();


            const sprite = new mySprite();

            this.attach( sprite )

            this.$events.onArrowLeftPressed( ()=>{
                  sprite.x -= 0.05;
                  sprite.costume = 1
            });
            this.$events.onArrowRightPressed( ()=>{
                  sprite.x += 0.05;
                  sprite.costume = 2
            });
            this.$events.onArrowUpPressed(()=>{
                  sprite.y += 0.05;
                  sprite.costume = 0
            })
            this.$events.onArrowDownPressed(()=>{
                  sprite.y -= 0.05;
                  sprite.costume = 3
            })
            //this.execute( this.update );
      }
      onDestroyed(game: GameController): void {}
}
// finally, use the scene
game.useScene( FirstScene );
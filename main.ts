import { GameController } from './Fly/controller/gameController.js';
import { Types, FlyScene, game, FlySprite2D, Load, bug, Shapes } from './Fly/fly.js';


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
class mySprite extends FlySprite2D {
      private time = 100;
      private nextFrameTime = 60;
      private currCostume = 0;
      doAnimation = false;
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
            this.costume = 3
      }
      animate( delta: number ){
            if( !this.doAnimation || delta < this.nextFrameTime ) return;
            this.nextFrameTime = delta + this.time;
            this.frame = this.currCostume;
            this.currCostume ++;

            if( this.currCostume >= this.costumes ){
                  this.currCostume = 0
                  this.doAnimation = false;
            }
      }
      
}
class FirstScene extends FlyScene {
      update(){
            this.$renderer.draw();
      }
      onCreate(game: GameController): void {

            this.$game.refs.i = 0;
            //setup debug camera
            this.$debug.globalCamera();


            const sprite = new mySprite();
            const sprite2 = new mySprite();
            sprite2.x = 0;
            sprite2.z = -2.5;
            sprite.z = -3
            sprite.costume = 0;
            sprite2.costume = 3;
            const bg = this.$renderer.create({
                  ...Shapes.rectangle(100, 100, { x: 0, y: 0, z: -10}),
                  staticColor: { r: 0.4, g: 0.8, b: 0.5, a: 1},
                  perspective: true,
            })

            this.attach( 'bg', bg );

            this.attach( sprite2 )
            this.attach( sprite )


            this.$events.onArrowLeftPressed( ()=>{
                  sprite.x -= 0.05;
                  sprite.costume = 1
                  sprite.doAnimation = true;
            });
            this.$events.onArrowRightPressed( ()=>{
                  sprite.x += 0.05;
                  sprite.costume = 2
                  sprite.doAnimation = true;
            });
            this.$events.onArrowUpPressed(()=>{
                  sprite.y += 0.05;
                  sprite.costume = 3
                  sprite.doAnimation = true;
            })
            this.$events.onArrowDownPressed(()=>{
                  sprite.y -= 0.05;
                  sprite.costume = 0
                  sprite.doAnimation = true;
            })
            this.$events.onKeyRelease( ()=>{
                  sprite.doAnimation = false;
                  sprite.frame = 0;
            })
            //this.execute( this.update );
      }
      onDestroyed(game: GameController): void {}
}
// finally, use the scene
game.useScene( FirstScene );

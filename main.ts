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
/**
<!-- sample rectangle -->
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
  <linearGradient id="linear" x1="0%" y1="100%" x2="0%" y2="0%">
  <stop offset="0%" stop-color="#cc00ff"/>
  <stop offset="100%" stop-color="#6600ff"/>
  </linearGradient>
  <linearGradient id="e" x1="0%" y1="100%" x2="0%" y2="0%" gradientUnits="userSpaceOnUse">
        <stop stop-color="#cc00ff" offset="0" />
        <stop stop-color="#6600ff" offset="1" />
    </linearGradient>
  </defs>

  <circle cx="100" cy="50" r="20" fill="white" stroke="url(#linear)" stroke-width="5"></circle>
  <circle cx="80" cy="45" r="10" fill="red" stroke="url(#linear)" stroke-width="5"></circle>
  <circle cx="120" cy="45" r="10" fill="red" stroke="url(#linear)" stroke-width="5"></circle>

  

  <ellipse cx="100" cy="150" rx="35" ry="40" fill="white" stroke="url(#linear)" stroke-width="5"></ellipse>
  <ellipse cx="100" cy="90" rx="25" ry="25" fill="white" stroke="url(#linear)" stroke-width="5"></ellipse>

  <line x1="100" y1="115" x2="100" y2="65" stroke="url(#e)" stroke-width="5"/>
  <line x1="90" y1="115" x2="90" y2="65" stroke="url(#e)" stroke-width="5"/>
  <line x1="110" y1="115" x2="110" y2="65" stroke="url(#e)" stroke-width="5"/>

    <line x1="75" y1="90" x2="40" y2="65" stroke="url(#e)" stroke-width="7"/>
    <line x1="40" y1="67" x2="35" y2="30" stroke="url(#e)" stroke-width="7"/>

    <line x1="75" y1="90" x2="10" y2="110" stroke="url(#e)" stroke-width="7"/>

    <line x1="125" y1="90" x2="160" y2="65" stroke="url(#e)" stroke-width="7"/>
    <line x1="160" y1="67" x2="165" y2="30" stroke="url(#e)" stroke-width="7"/>

    <line x1="125" y1="90" x2="190" y2="110" stroke="url(#e)" stroke-width="7"/>

  <ellipse cx="85" cy="185" rx="25" ry="60" fill="#00eeff55" stroke="url(#linear)" stroke-width="5" transform="rotate(-20 -30 0)""></ellipse>
  <ellipse cx="108" cy="100" rx="25" ry="60" fill="#00eeff55" stroke="url(#linear)" stroke-width="5" transform="rotate( 25 0 0)"></ellipse>
</svg>
 */
import { 
      Types, 
      FlyScene, 
      game, 
      FlySprite2D,
      Load, 
      bug, 
      Shapes, 
      FlyGame,
      FlyCollisions,
 } from './Fly/fly.js';


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

      walk: Record<string, ()=>void> = {};
      
      constructor( private isNPC: boolean = false ) {
            super({ 
                  image: game.assets.images.img,
                  frames: 4,
                  costumes: 4, 
                  scale: 1
            });
            this.z = -30.1;
            this.walk.down = this.createAnimation([{
                  from: 0,
                  to: 4,
                  costume: 0,
                  deltaTime: 60,
                  callback: ()=> this.y -= 0.1
            }])
            this.walk.up = this.createAnimation([{
                  from: 0,
                  to: 4,
                  costume: 3,
                  deltaTime: 60,
                  callback: ()=> this.y += 0.1
            }])
            this.walk.left = this.createAnimation([{
                  from: 0,
                  to: 4,
                  costume: 1,
                  deltaTime: 60,
                  callback: ()=> this.x -= 0.1
            }])
            this.walk.right = this.createAnimation([{
                  from: 0,
                  to: 4,
                  costume: 2,
                  deltaTime: 60,
                  callback: ()=> this.x += 0.1
            }])


            if( isNPC ){
                  this.walk.path = this.createAnimation([{
                        from: 0,
                        to: 4,
                        for: 4,
                        costume: 2,
                        deltaTime: 60,
                        callback: ()=> this.x += 0.05
                  },{
                        from: 0,
                        to: 4,
                        for: 4,
                        costume: 1,
                        deltaTime: 60,
                        callback: ()=> this.x -= 0.05
                  },{
                        from: 0,
                        to: 4,
                        for: 4,
                        costume: 3,
                        deltaTime: 60,
                        callback: ()=> this.y += 0.05
                  },{
                        from: 0,
                        to: 4,
                        for: 4,
                        costume: 0,
                        deltaTime: 60,
                        callback: ()=> this.y -= 0.05
                  }])
            }
      }

      onDraw(): void {
            if( this.isNPC )
                  this.walk.path();
                  
            if( !FlyCollisions.isOnScreen(this) )
                  console.log('no');
      }

      onDismiss(): void {
            throw new Error('Method not implemented.');
      }
      onEnter(): void {
            //bug();
            this.costume = 3
      }
      
}
class FirstScene extends FlyScene {
      update(){
            this.$renderer.draw();
      }
      onCreate(game: FlyGame): void {
            

            const sprite = new mySprite();
            const sprite2 = new mySprite( true );

            
            sprite.z = -30
            sprite.costume = 0;

            const bg = this.$renderer.create({
                  ...Shapes.rectangle(1, 1, { x: 0, y: 0, z: -50}),
                  staticColor: { r: 0.4, g: 0.8, b: 0.5, a: 1},
                  perspective: true
            })

            this.attach( 'bg', bg );

            this.attach( sprite2 )
            this.attach( sprite )

            this.attachCameraToEntity( sprite );

            this.$events.onArrowLeftPressed( ()=>{
                  sprite.walk.left();
            });
            this.$events.onArrowRightPressed( ()=>{
                  sprite.walk.right();
            });
            this.$events.onArrowUpPressed(()=>{
                  sprite.walk.up();
            })
            this.$events.onArrowDownPressed(()=>{
                  sprite.walk.down();
            })
            this.$events.onKeyRelease( ()=>{
                  sprite.frame = 0;
            })
      }
      onDestroyed( game: FlyGame ): void {}
}
// finally, use the scene
game.useScene( FirstScene );

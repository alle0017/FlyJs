import { Renderer } from './rendering/GLRenderer.js';
import { Load } from './controller/loadData.js';
import { GameController } from './controller/gameController.js';


const game = await GameController.get();

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
const texture = [
      // Front face

      1, 1,
      0, 1,
      0, 0,
      1, 0,

      1, 1,
      0, 1,
      0, 0,
      1, 0,

      1, 1,
      0, 1,
      0, 0,
      1, 0,

      1, 1,
      0, 1,
      0, 0,
      1, 0,

      1, 1,
      0, 1,
      0, 0,
      1, 0,

      1, 1,
      0, 1,
      0, 0,
      1, 0,
      
      1, 1,
      0, 1,
      0, 0,
      1, 0,
]
const img = await Load.image( 'pipeline.jpg' );
const image = game.renderer.create({
      indices: [
            0,1,2,
            0,2,3,
       ],
      vertices: [ 
            -1,  1, 0,
            -1, -1, 0,
            1, -1, 0,
            1,  1, 0,
      ],
      color,
      perspective: true
})
game.renderer.append( 'img', image ).setAttributes('img', { 
      translation: {x: 0, y: 0, z: -5}, 
      scale: 0.5
})
const f = ()=>{
      game.renderer.draw();
      requestAnimationFrame(f)
}
f();
      
import { Load } from './controller/loadData.js';
import { Matrix } from './rendering/matrix/matrices.js';
import { GameController } from './controller/gameController.js';
import { Axis, Point3D, Primitives } from './rendering/types.js';


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
/*
const img = await Load.image( 'pipeline.jpg' );
const image =  game.$renderer.create({
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
      imageData: {
            image: img,
            textureCoords: [

                  1,  1,
                  0,  1, 
                  0, 0,
                  1, 0, 
            ]
      },
      bonesData: {
            bones: 3,
            weights: [
                  0, 0.2, 0.3, 0.1,
                  0.1, 0.4, 0.3, 0.1,
                  1, 0.2, 0.8, 0.1,
            ],
            indices: [
                  0, 1, 2, 2,
                  1, 0, 2, 2,
                  0, 1, 1, 1,
            ],
            root: 0
      },
      perspective: true
})
*/
const image =  game.$renderer.create({
      vertices,
      indices,
      staticColor: { r: 0, g: 1, b: 0.3, a: 1},
      perspective: true,
      bonesData: {
            bones: 5,
            weights: weights,
            indices: boneIndex,
            root: 0
      },
      primitive: Primitives.lines,
})
let i = 0;
let j = 0;
let val = 1;
//game.debug.globalCamera();
 game.$renderer.append( 'img', image ).setAttributes('img', {
      translation: { x: 0, y: 0, z: -2},
      scale: 0.1,
      bones: {
            angle: [
                  0, 60, 0, 0, 60
            ]
      }
});
const f = ()=>{
       game.$renderer.draw();
      requestAnimationFrame(f)
}
f();
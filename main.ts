import { Renderer } from './rendering/GLRenderer.js';
import { Shapes } from './rendering/shapes.js';
const r = new Renderer(
      document.getElementById('gl') as HTMLCanvasElement
);
await r.init();
const color =  [
      
      1.0, 0.0, 0.0, 1.0, // Front face: white
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,

      1.0, 0.0, 0.0, 1.0, // Back face: red
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,

      0.0, 1.0, 0.0, 1.0, // Top face: green
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,

      0.0, 0.0, 1.0, 1.0, // Bottom face: blue
      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,

      1.0, 1.0, 0.0, 1.0, // Right face: yellow
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,

      1.0, 0.0, 1.0, 1.0, 
      1.0, 0.0, 1.0, 1.0, 
      1.0, 0.0, 1.0, 1.0, 
      1.0, 0.0, 1.0, 1.0, 
]
const obj1 = r.create({
      ...Shapes.rectangle( 0.1, 0.13 ),
      color,
      static: true
})
const obj2 = r.create({
      ...Shapes.triangle(),
      color: [
            0, 1, 1, 1,
            1, 1, 0, 1,
            0.5, 0.1, 1, 1, 
      ],
      static: true
})
if( obj1 && obj2 ){
      r.append( obj1 );
      r.append( obj2 );
      const f = ()=>{
            r.draw();
            requestAnimationFrame(f)
      }
      f();
}
      
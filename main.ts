import { Renderer } from './rendering/GPURenderer.js';
import { Shapes } from './rendering/shapes.js';
import { Axis } from './rendering/types.js';
const r = new Renderer(
      document.getElementById('gl') as HTMLCanvasElement
);
await r.init();
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
const obj1 = r.create({
      ...Shapes.cube( 0.1 ),
      color,
      perspective: true
})
const obj2 = r.create({
      ...Shapes.cube( 0.1 ),
      color,
      static: true
})
if(  obj2 ){
      r.append( 'obj1', obj1 ).setAttributes('obj1', { translation: { x: 0, y: 0, z: -2}});
      r.append( 'obj2', obj2 ).setAttributes('obj2', { translation: { x: 0, y: 1, z: -2}});
      let i = 0;
      const f = ()=>{
            r.setAttributes('obj1', {  angle: i, axis: Axis.X })
            r.draw();
            i+= 0.1;
            requestAnimationFrame(f)
      }
      f();
}
      
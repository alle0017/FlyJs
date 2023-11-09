import { WebGPUShader } from './rendering/prova/GPUShader.js';
import { WebGPURenderer } from './rendering/prova/GPURenderer.js';
/*
async function main(){


console.log(
      new WebGlShader(WebGlShader.FRAGMENT)
      .setFragmentShaderForTexture()
      .get()
      );
      
      console.log(new WebGlShader(WebGlShader.VERTEX)
      .setVertexShaderForTexture()
      .get()
      );
      const camera = new Camera();
      const map = new Map();
      const game = Game.getInstance();

      map.set('ArrowUp', ()=>camera.y += 0.1);
      map.set('ArrowDown', ()=>camera.y -= 1);
      map.set('ArrowLeft', ()=>camera.x -= 1);
      map.set('ArrowRight', ()=>camera.x += 1);
      window.addEventListener('keydown', (e)=> {
            if(map.has(e.code))
                  map.get(e.code)()
      })
      const sprite = new Sprite2D(game, {
            img: 'prova.png',
            camera: camera,
            position: {x: 0, y: 0, z: -10},
            frames: 4,
            costumes: 4,
      })
      function anim(){
            sprite.animate();
      }
      game.functions.push(anim);
      game.loop();
}
main();*/
const r = await WebGPURenderer.new(document.getElementById('gl'));
const shaderInfo = new WebGPUShader();
shaderInfo
    .useInterpolatedColor()
    .usePerspective()
    .useDynamicElement();
console.log(shaderInfo.get().vertex + shaderInfo.get().fragment);
for (let el of shaderInfo.attributesData) {
    if (el.name === 'color')
        el.data = [
            1, 0, 1, 1,
            1, 1, 0, 1,
            0, 1, 1, 1,
        ];
    else if (el.name === 'vertex_position') {
        el.data = [
            0.1, 0.1, 0,
            0.7, 0.7, 0,
            0.1, 0.7, 0,
        ];
    }
}
for (let el of shaderInfo.uniformsData) {
    if (el.name === 'transformation')
        el.data = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    else if (el.name === 'perspective') {
        el.data = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    }
}
const fn = r.setup(shaderInfo, [0, 1, 2]);
if (fn) {
    fn();
}

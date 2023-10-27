import { RendererDelegate } from "../rendering/renderer.js";

export class Game {

      private static instance: Game = new Game();
      
      renderer: RendererDelegate;
      time: number = 0;
      functions: (()=>void)[] = [];

      private constructor(){
            const cvs = document.createElement('canvas');
            if(!cvs) 
                  throw 'something went wrong with canvas creation';

            cvs.width = 800;
            cvs.height = 600;
            cvs.style.position = 'absolute';
            cvs.style.top = '0px';
            cvs.style.left = '0px';
            document.body.appendChild(cvs);

            this.renderer = new RendererDelegate(cvs);
      }

      static getInstance(): Game {
            return this.instance;
      }
      loop(): void {
            const main = (time: number)=>{
                  this.time = time;
                  for(let func of this.functions)
                        func();
                  requestAnimationFrame(main);
            }
            requestAnimationFrame(main);
      }
}
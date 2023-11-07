type LoopedFunctionAttributes = {
      function: LoopedFunction;
      id: number;
      priority: number;
}
type LoopedFunction = ()=>void;

export class LoopsController {
      private functions: LoopedFunctionAttributes[] = [];
      private inExecution: boolean = false;
      private requestId: number = 0;
      private lastUsedId = 0;

      time: number = 0;

      constructor(){}

      private main(): (arg0: number)=>void {
            const main = (time: number)=>{
                  this.time = time;
                  for(let attributes of this.functions)
                        attributes.function();
                  this.requestId = requestAnimationFrame(main);
            }
            return main;
      }

      private loopedFunctionAttributesFactory(func: LoopedFunction, priority?: number): LoopedFunctionAttributes {
            this.lastUsedId ++;
            !priority && (priority = this.functions.length? this.functions[
                  this.functions.length - 1
            ].priority: 0);
            return {
                  function: func,
                  id: this.lastUsedId,
                  priority: priority
            }
      }

      startLoop(): void {
            if(this.inExecution) return;
            const main = this.main();
            this.requestId = requestAnimationFrame(main);
            this.inExecution = true;
      }

      stopLoop(): void {
            if(!this.inExecution) return;
            cancelAnimationFrame(this.requestId);
            this.inExecution = false;
      }

      addFunction(func: LoopedFunction, priority?: number): void {
            const attributes = this.loopedFunctionAttributesFactory(func, priority);
            for(let i = this.functions.length; i >= 0 ; i--){
                  if(attributes.priority > this.functions[i].priority) continue;
                  this.functions.splice(i, 0, attributes);
                  break;
            }
      }
}
export type LoopedFunction = (...args: any[]) => void;
export type FunctionInfo = {
      function: LoopedFunction,
      id: number
}
export class LoopController {
      private id = 0;
      private functions: FunctionInfo[] = [];
      constructor(){}
      add( fn: LoopedFunction ): number {
            this.functions.push( {
                  function: fn,
                  id: this.id
            });
            return this.id++;
      }
      remove( fnId: number ): LoopedFunction | undefined {
            let index = -1;
            this.functions.every((val, i)=>{
                  if ( val.id === fnId ){
                        index = i;
                        return false;
                  }
                  return true;
            })
            if( index >= 0 )
                  this.functions.splice( index, 1 );
            return;
      }
      execute(): void {
            this.functions.forEach( (node)=>{
                  node.function();
            });
      }
}

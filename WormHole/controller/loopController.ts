export type LoopedFunction = (...args: any[]) => void;
export class LoopController {
      private loopId = 0;
      private functions: LoopedFunction[] = [];
      private _delta = 0;
      private _prevTimestamp = 0;
      get delta(): number { return this._delta; }
      set delta(value: number) {}
      get timeFromStart(): number { return this._prevTimestamp; }
      set timeFromStart(value: number){}
      constructor(){}
      private executeFunctions(): void {
            this.functions.forEach( fn =>{
                  fn();
            });
      }
      add( fn: LoopedFunction ): void {
            this.functions.push( fn );
      }
      remove( fn: LoopedFunction ): void {
            this.functions.every((val, i)=>{
                  if ( fn.toString() == val.toString() ){
                        this.functions.splice( i, 1 );
                        return false;
                  }
                  return true;
            })
      }
      removeAll(){
            this.functions = [];
      }
      execute(){
            const fn: FrameRequestCallback = (delta: number)=>{
                  this._delta = delta - this._prevTimestamp;
                  this._prevTimestamp = delta;
                  this.executeFunctions();
                  this.loopId = requestAnimationFrame(fn);
            }
            this.loopId = requestAnimationFrame(fn);
      }
      stop(){
            cancelAnimationFrame(this.loopId);
      }
}

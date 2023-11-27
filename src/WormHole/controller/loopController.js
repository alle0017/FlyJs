export class LoopController {
    get delta() { return this._delta; }
    set delta(value) { }
    get timeFromStart() { return this._prevTimestamp; }
    set timeFromStart(value) { }
    constructor() {
        this.loopId = 0;
        this.functions = [];
        this._delta = 0;
        this._prevTimestamp = 0;
    }
    executeFunctions() {
        this.functions.forEach(fn => {
            fn();
        });
    }
    add(fn) {
        this.functions.push(fn);
    }
    remove(fn) {
        this.functions.every((val, i) => {
            if (fn.toString() == val.toString()) {
                this.functions.splice(i, 1);
                return false;
            }
            return true;
        });
    }
    removeAll() {
        this.functions = [];
    }
    execute() {
        const fn = (delta) => {
            this._delta = delta - this._prevTimestamp;
            this._prevTimestamp = delta;
            this.executeFunctions();
            this.loopId = requestAnimationFrame(fn);
        };
        this.loopId = requestAnimationFrame(fn);
    }
    stop() {
        cancelAnimationFrame(this.loopId);
    }
}

export class LoopController {
    constructor() {
        this.id = 0;
        this.functions = [];
    }
    add(fn) {
        this.functions.push({
            function: fn,
            id: this.id
        });
        return this.id++;
    }
    remove(fnId) {
        let index = -1;
        this.functions.every((val, i) => {
            if (val.id === fnId) {
                index = i;
                return false;
            }
            return true;
        });
        if (index >= 0)
            this.functions.splice(index, 1);
        return;
    }
    execute() {
        this.functions.forEach((node) => {
            node.function();
        });
    }
}

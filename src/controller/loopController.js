export class LoopsController {
    constructor() {
        this.functions = [];
        this.inExecution = false;
        this.requestId = 0;
        this.lastUsedId = 0;
        this.time = 0;
    }
    main() {
        const main = (time) => {
            this.time = time;
            for (let attributes of this.functions)
                attributes.function();
            this.requestId = requestAnimationFrame(main);
        };
        return main;
    }
    loopedFunctionAttributesFactory(func, priority) {
        this.lastUsedId++;
        !priority && (priority = this.functions.length ? this.functions[this.functions.length - 1].priority : 0);
        return {
            function: func,
            id: this.lastUsedId,
            priority: priority
        };
    }
    startLoop() {
        if (this.inExecution)
            return;
        const main = this.main();
        this.requestId = requestAnimationFrame(main);
        this.inExecution = true;
    }
    stopLoop() {
        if (!this.inExecution)
            return;
        cancelAnimationFrame(this.requestId);
        this.inExecution = false;
    }
    addFunction(func, priority) {
        const attributes = this.loopedFunctionAttributesFactory(func, priority);
        for (let i = this.functions.length; i >= 0; i--) {
            if (attributes.priority > this.functions[i].priority)
                continue;
            this.functions.splice(i, 0, attributes);
            break;
        }
    }
}

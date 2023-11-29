export var EventEmitter;
(function (EventEmitter) {
    const events = new Map();
    let ARROWS;
    (function (ARROWS) {
        ARROWS["UP"] = "ArrowUp";
        ARROWS["DOWN"] = "ArrowDown";
        ARROWS["LEFT"] = "ArrowLeft";
        ARROWS["RIGHT"] = "ArrowRight";
    })(ARROWS || (ARROWS = {}));
    function fire(name, message) {
        const handlers = events.get(name);
        if (!handlers || handlers.length <= 0)
            return;
        handlers.forEach(handler => handler(message));
    }
    EventEmitter.fire = fire;
    function on(name, handler) {
        const handlers = events.get(name);
        if (handlers)
            handlers.push(handler);
        else
            events.set(name, [handler]);
    }
    EventEmitter.on = on;
    function remove(name, handler) {
        const handlers = events.get(name);
        if (!handlers || handlers.length <= 0)
            return;
        handlers.every((elem, index) => {
            if (handler.toString() == elem.toString()) {
                handlers.splice(index, 1);
                return true;
            }
            return false;
        });
    }
    EventEmitter.remove = remove;
    function deleteEvent(name) {
        if (events.has(name))
            events.delete(name);
    }
    EventEmitter.deleteEvent = deleteEvent;
    function onArrowUpPressed(handler) {
        on(ARROWS.UP, handler);
    }
    EventEmitter.onArrowUpPressed = onArrowUpPressed;
    function onArrowDownPressed(handler) {
        on(ARROWS.DOWN, handler);
    }
    EventEmitter.onArrowDownPressed = onArrowDownPressed;
    function onArrowLeftPressed(handler) {
        on(ARROWS.LEFT, handler);
    }
    EventEmitter.onArrowLeftPressed = onArrowLeftPressed;
    function onArrowRightPressed(handler) {
        on(ARROWS.RIGHT, handler);
    }
    EventEmitter.onArrowRightPressed = onArrowRightPressed;
})(EventEmitter || (EventEmitter = {}));

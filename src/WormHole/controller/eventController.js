export var EventEmitter;
(function (EventEmitter) {
    const events = new Map();
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
})(EventEmitter || (EventEmitter = {}));

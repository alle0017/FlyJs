import { BufferDataType, } from "./generics.js";
export class Renderer {
    getTypedArrayInitializer(type) {
        if (type === BufferDataType.uint16)
            return Uint16Array;
        return Float32Array;
    }
    error(component, type) {
        throw `something went wrong in ${component} ${type}`;
    }
}

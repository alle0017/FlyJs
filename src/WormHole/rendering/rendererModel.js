import { BufferDataType, Primitives, } from "./types.js";
export class Renderer {
    getTypedArrayInitializer(type) {
        if (type === BufferDataType.uint16)
            return Uint16Array;
        return Float32Array;
    }
    getPrimitivesVertexCount(primitive) {
        switch (primitive) {
            case Primitives.lines: return 2;
            case Primitives.lines_strip: return 2;
            case Primitives.triangles: return 3;
            case Primitives.triangles_strip: return 3;
            default: return 1;
        }
    }
    error(component, type) {
        throw `something went wrong in ${component} ${type}`;
    }
}

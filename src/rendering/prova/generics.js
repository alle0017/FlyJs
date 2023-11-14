export var BufferUsage;
(function (BufferUsage) {
    BufferUsage[BufferUsage["vertex"] = 0] = "vertex";
    BufferUsage[BufferUsage["index"] = 1] = "index";
})(BufferUsage || (BufferUsage = {}));
export var Axis;
(function (Axis) {
    Axis["X"] = "x";
    Axis["Y"] = "y";
    Axis["Z"] = "z";
})(Axis || (Axis = {}));
export var ProgramMode;
(function (ProgramMode) {
    ProgramMode[ProgramMode["webgpu"] = 1] = "webgpu";
    ProgramMode[ProgramMode["webgl"] = 2] = "webgl";
})(ProgramMode || (ProgramMode = {}));
export var Primitives;
(function (Primitives) {
    Primitives[Primitives["triangles"] = 1] = "triangles";
    Primitives[Primitives["points"] = 2] = "points";
    Primitives[Primitives["lines"] = 3] = "lines";
    Primitives[Primitives["lines_strip"] = 4] = "lines_strip";
    Primitives[Primitives["triangles_strip"] = 5] = "triangles_strip";
})(Primitives || (Primitives = {}));
export var RendererErrorType;
(function (RendererErrorType) {
    RendererErrorType["creation"] = "creation";
    RendererErrorType["initialization"] = "initialization";
    RendererErrorType["acquisition"] = "acquisition";
})(RendererErrorType || (RendererErrorType = {}));
export var BufferDataType;
(function (BufferDataType) {
    BufferDataType[BufferDataType["uint16"] = 1] = "uint16";
    BufferDataType[BufferDataType["float32"] = 2] = "float32";
})(BufferDataType || (BufferDataType = {}));

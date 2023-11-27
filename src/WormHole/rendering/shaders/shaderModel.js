export var AttributesName;
(function (AttributesName) {
    AttributesName["vertex"] = "vertex_position";
    AttributesName["color"] = "color";
    AttributesName["textureCoordinates"] = "texture_coords";
    AttributesName["skIndices"] = "sk_indices";
    AttributesName["skWeights"] = "weights";
})(AttributesName || (AttributesName = {}));
export var UniformsName;
(function (UniformsName) {
    UniformsName["perspective"] = "perspective";
    UniformsName["transformation"] = "transformation";
    UniformsName["bumpScale"] = "bump_scale";
    UniformsName["framePosition"] = "frame_position";
    //bones
})(UniformsName || (UniformsName = {}));
export var BindingsName;
(function (BindingsName) {
    BindingsName["texture"] = "texture";
    BindingsName["textureSampler"] = "texture_sampler";
    BindingsName["displacementMap"] = "displacement_map";
    BindingsName["bones"] = "bones";
})(BindingsName || (BindingsName = {}));
class Shader {
    constructor() {
        this.varyings = [];
        this.attributes = [];
        this.uniforms = [];
        this.positionTransformations = [];
        this.vCode = [];
        this.fCode = [];
        this.fragmentReturnedValue = '';
        this.vertexReturnedValue = '';
        this._attributesData = new Map();
        this._uniformsData = new Map();
        this._functions = '';
    }
}
Shader.FRAGMENT = 0;
Shader.VERTEX = 1;
Shader.MAT3x2 = 0;
Shader.MAT2x2 = 1;
Shader.MAT3x3 = 2;
Shader.MAT4x4 = 3;
Shader.VEC2 = 4;
Shader.VEC3 = 5;
Shader.VEC4 = 6;
Shader.INT = 10;
Shader.FLOAT = 7;
Shader.BOOL = 9;
Shader.TEXTURE2D = 8;
Shader.SAMPLER = 11;
Shader.types = [];
export { Shader };

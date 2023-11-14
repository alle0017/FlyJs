export var Shapes;
(function (Shapes) {
    function triangle() {
        const vertices = [
            0.25, -0.25, 0,
            -0.25, -0.25, 0,
            0, 0.25, 0,
        ];
        return {
            vertices,
            indices: [0, 1, 2]
        };
    }
    Shapes.triangle = triangle;
    function rectangle(width, height, center) {
        const vertices = [
            -1, -1, 0,
            1, -1, 0,
            1, 1, 0,
            -1, 1, 0,
        ];
        if (width) {
            if (!height)
                height = width;
            width /= 2;
            height /= 2;
            vertices.forEach((_, i, arr) => {
                if (!(i % 3))
                    arr[i] *= width;
                else if (i % 3 == 1)
                    arr[i] *= height;
            });
        }
        if (center) {
            vertices.forEach((_, i, arr) => {
                if (!(i % 3))
                    arr[i] += center.x;
                else if (i % 3 == 1)
                    arr[i] += center.y;
                else if ('z' in center)
                    arr[i] += center.z;
            });
        }
        return {
            indices: [0, 1, 2, 0, 2, 3],
            vertices
        };
    }
    Shapes.rectangle = rectangle;
    function cube(side, center) {
        const vertices = [
            // Front face
            -1.0, -1.0, 1,
            1.0, -1.0, 1,
            1.0, 1.0, 1,
            -1.0, 1.0, 1,
            // Back face
            -1.0, -1.0, -1,
            -1.0, 1.0, -1,
            1.0, 1.0, -1,
            1.0, -1.0, -1,
            // Top face
            -1.0, 1.0, -1,
            -1.0, 1.0, 1,
            1.0, 1.0, 1,
            1.0, 1.0, -1,
            // Bottom face
            -1.0, -1.0, -1,
            1.0, -1.0, -1,
            1.0, -1.0, 1,
            -1.0, -1.0, 1,
            // Right face
            1.0, -1.0, -1,
            1.0, 1.0, -1,
            1.0, 1.0, 1,
            1.0, -1.0, 1,
            // Left face
            -1.0, -1.0, -1,
            -1.0, -1.0, 1,
            -1.0, 1.0, 1,
            -1.0, 1.0, -1,
        ];
        if (side) {
            vertices.forEach((_, i, arr) => { arr[i] *= side; });
        }
        if (center) {
            vertices.forEach((_, i, arr) => {
                if (!(i % 3))
                    arr[i] += center.x;
                else if (i % 3 == 1)
                    arr[i] += center.y;
                else
                    arr[i] += center.z;
            });
        }
        return {
            indices: [
                0,
                1,
                2,
                0,
                2,
                3,
                4,
                5,
                6,
                4,
                6,
                7,
                8,
                9,
                10,
                8,
                10,
                11,
                12,
                13,
                14,
                12,
                14,
                15,
                16,
                17,
                18,
                16,
                18,
                19,
                20,
                21,
                22,
                20,
                22,
                23,
            ],
            vertices
        };
    }
    Shapes.cube = cube;
    function parallelepiped(width, height, depth, center) {
        const vertices = [
            // Front face
            -1.0, -1.0, 1,
            1.0, -1.0, 1,
            1.0, 1.0, 1,
            -1.0, 1.0, 1,
            // Back face
            -1.0, -1.0, -1,
            -1.0, 1.0, -1,
            1.0, 1.0, -1,
            1.0, -1.0, -1,
            // Top face
            -1.0, 1.0, -1,
            -1.0, 1.0, 1,
            1.0, 1.0, 1,
            1.0, 1.0, -1,
            // Bottom face
            -1.0, -1.0, -1,
            1.0, -1.0, -1,
            1.0, -1.0, 1,
            -1.0, -1.0, 1,
            // Right face
            1.0, -1.0, -1,
            1.0, 1.0, -1,
            1.0, 1.0, 1,
            1.0, -1.0, 1,
            // Left face
            -1.0, -1.0, -1,
            -1.0, -1.0, 1,
            -1.0, 1.0, 1,
            -1.0, 1.0, -1,
        ];
        if (width) {
            if (!height)
                height = width;
            if (!depth)
                depth = height;
            width /= 2;
            height /= 2;
            depth /= 2;
            vertices.forEach((_, i, arr) => {
                if (!(i % 3))
                    arr[i] *= width;
                else if (i % 3 == 1)
                    arr[i] *= height;
                else
                    arr[i] *= depth;
            });
        }
        if (center) {
            vertices.forEach((_, i, arr) => {
                if (!(i % 3))
                    arr[i] += center.x;
                else if (i % 3 == 1)
                    arr[i] += center.y;
                else
                    arr[i] += center.z;
            });
        }
        return {
            indices: [
                0,
                1,
                2,
                0,
                2,
                3,
                4,
                5,
                6,
                4,
                6,
                7,
                8,
                9,
                10,
                8,
                10,
                11,
                12,
                13,
                14,
                12,
                14,
                15,
                16,
                17,
                18,
                16,
                18,
                19,
                20,
                21,
                22,
                20,
                22,
                23,
            ],
            vertices
        };
    }
    Shapes.parallelepiped = parallelepiped;
})(Shapes || (Shapes = {}));

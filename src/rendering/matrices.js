import { Axis, } from "./generics.js";
export var Matrix;
(function (Matrix) {
    function rotation(angle, axis, toRad = true) {
        if (toRad)
            angle = degToRad(angle);
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        if (axis == Axis.X) {
            return [
                1, 0, 0, 0,
                0, c, s, 0,
                0, -s, c, 0,
                0, 0, 0, 1,
            ];
        }
        else if (axis == Axis.Y) {
            return [
                c, 0, -s, 0,
                0, 1, 0, 0,
                s, 0, c, 0,
                0, 0, 0, 1,
            ];
        }
        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    }
    Matrix.rotation = rotation;
    function translate(point) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            point.x, point.y, point.z, 1,
        ];
    }
    Matrix.translate = translate;
    function scale(scale) {
        if (typeof scale === 'number') {
            return [
                scale, 0, 0, 0,
                0, scale, 0, 0,
                0, 0, scale, 0,
                0, 0, 0, 1,
            ];
        }
        return [
            scale.x, 0, 0, 0,
            0, scale.y, 0, 0,
            0, 0, scale.z, 0,
            0, 0, 0, 1,
        ];
    }
    Matrix.scale = scale;
    function prospective(fieldOfView, resolution, near, far, toRad = true) {
        if (toRad)
            fieldOfView = degToRad(fieldOfView);
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfView);
        const rangeInv = 1.0 / (near - far);
        return [
            f / resolution, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    }
    Matrix.prospective = prospective;
    Matrix.IDENTITY_4X4 = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
    function dot(m1, col1, m2) {
        const res = [];
        const row1 = m1.length / col1;
        const row2 = col1;
        const col2 = m2.length / row2;
        if (!Number.isInteger(row1)) {
            throw "Invalid column number for matrix 1";
        }
        if (!Number.isInteger(row2)) {
            throw "Invalid column number for matrix 2";
        }
        if (row2 != col1) {
            throw "Invalid matrix. number of columns of the first matrix must be equal to the number of rows of the second matrix";
        }
        for (let i = 0; i < row1; i++) {
            for (let j = 0; j < col2; j++) {
                let sum = 0;
                for (let k = 0; k < row2; k++) {
                    sum += m1[i * col1 + k] * m2[k * col2 + j];
                }
                res[i * col2 + j] = sum;
            }
        }
        return res;
    }
    Matrix.dot = dot;
    Matrix.composeMatrix = dot;
    function invert(mat, col) {
        let m = toMatrix(mat, col);
        let I = identityMatrix(col);
        m = backwardTransformation(gaussJordan(m, I));
        I = backwardTransformation(I);
        m = gaussJordan(m, I);
        m = backwardTransformation(m);
        I = backwardTransformation(I);
        for (let i = 0; i < m.length; i++) {
            if (!m[i][i]) {
                console.warn(`cannot invert the matrix ${mat}`);
                return mat;
            }
            for (let j = 0; j < I[i].length; j++) {
                I[i][j] /= m[i][i];
            }
        }
        return flat(I);
    }
    Matrix.invert = invert;
    function flat(m) {
        const res = [];
        m.forEach(el => res.push(...el));
        return res;
    }
    Matrix.flat = flat;
    function toMatrix(vec, col) {
        const m = [];
        const rows = vec.length / col;
        for (let i = 0; i < rows; i++) {
            m.push([]);
            for (let j = 0; j < col; j++) {
                m[i][j] = vec[i * col + j];
            }
        }
        return m;
    }
    Matrix.toMatrix = toMatrix;
    function gaussJordan(mat, mat2) {
        const m = [...mat];
        for (let i = 0; i < m.length; i++) {
            for (let j = i + 1; j < m.length; j++) {
                mat2 && (mat2[j] = combine(mat2[i], mat2[j], m[j][i], -m[i][i]));
                m[j] = combine(m[i], m[j], m[j][i], -m[i][i]);
            }
        }
        return m;
    }
    function backwardTransformation(mat) {
        const m = [];
        for (let i = mat.length - 1; i >= 0; i--) {
            m.push([]);
            for (let j = mat[i].length - 1; j >= 0; j--) {
                m[mat.length - 1 - i].push(mat[i][j]);
            }
        }
        return m;
    }
    function combine(v1, v2, k1 = 1, k2 = 1) {
        const res = [];
        for (let i = 0; i < v1.length; i++) {
            res.push(v1[i] * k1 + v2[i] * k2);
        }
        return res;
    }
    function identityMatrix(n) {
        const res = [];
        for (let i = 0; i < n; i++) {
            res.push([]);
            for (let j = 0; j < n; j++) {
                if (j === i) {
                    res[i].push(1);
                    continue;
                }
                res[i].push(0);
            }
        }
        return res;
    }
    function det(mat) {
        const i = 0;
        const m = [...mat];
        let d = 0;
        for (let j = 0; j < m[i].length; j++) {
            if (m.length != m[j].length)
                throw 'cannot invoke this method (Matrix.det) on non square matrix';
            const subMatrix = deleteRowAndCol(m, i, j);
            const currentDet = (m[j].length > 3) ? det(subMatrix) : det2x2(subMatrix);
            d += (-1) ** (i + j) * currentDet * m[i][j];
        }
        return d;
    }
    Matrix.det = det;
    function det2x2(m) {
        return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    }
    Matrix.det2x2 = det2x2;
    function transposeMatrix(m) {
        const T = [];
        for (let i = 0; i < m.length; i++) {
            T.push([]);
            for (let j = 0; j < m[i].length; j++) {
                T[j][i] = m[i][j];
            }
        }
        return T;
    }
    Matrix.transposeMatrix = transposeMatrix;
    function transpose(m, col) {
        const T = [];
        const rows = m.length / col;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < col; j++) {
                T[j * col + i] = m[i * col + j];
            }
        }
        return T;
    }
    Matrix.transpose = transpose;
    function deleteRowAndCol(m, row, col) {
        const res = [];
        for (let i = 0, ii = 0; i < m.length; i++) {
            if (i == row)
                continue;
            res.push([]);
            for (let j = 0, jj = 0; j < m[i].length; j++) {
                if (j == col)
                    continue;
                res[ii][jj] = m[i][j];
                jj++;
            }
            ii++;
        }
        return res;
    }
    Matrix.deleteRowAndCol = deleteRowAndCol;
    function substituteColumn(m, col, vec) {
        const res = [];
        for (let el of m) {
            res.push([...el]);
        }
        for (let i = 0; i < res.length; i++) {
            res[i][col] = vec[i];
        }
        return res;
    }
    Matrix.substituteColumn = substituteColumn;
    function degToRad(deg) {
        return deg * Math.PI / 180;
    }
    Matrix.degToRad = degToRad;
})(Matrix || (Matrix = {}));

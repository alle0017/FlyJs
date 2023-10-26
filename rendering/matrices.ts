import { Axis, AxisType, Point, } from "./generics.js";
export namespace Matrix {
      /**
      * Generates a 4x4 rotation matrix.
      * @param {number} angle - Rotation angle in degrees.
      * @param {AxisType} axis - Axis of rotation (X, Y, or Z).
      * @param {boolean} toRad - Whether the input angle is in radians (default is true).
      * @returns {number[]} - The 4x4 rotation matrix.
      */
      export function rotation(angle: number, axis: AxisType, toRad: boolean = true): number[] {
            if(toRad) angle = degToRad(angle);
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            
            if(axis == Axis.X){
                  return  [
                        1, 0, 0, 0,
                        0, c, s, 0,
                        0, -s, c, 0,
                        0, 0, 0, 1,
                  ];
            }else if(axis == Axis.Y){
                  return  [
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
      /**
      * Generates a 4x4 translation matrix.
      * @param {Point} point - Translation values in the x, y, and z directions.
      * @returns {number[]} - The 4x4 translation matrix.
      */
      export function translate(point: Point){
            return [
                  1, 0, 0, 0,
                  0, 1, 0, 0,
                  0, 0, 1, 0,
                  point.x, point.y, point.z, 1,
            ]
      }
      /**
      * Generates a 4x4 scale matrix.
      * @param {number | Point} scale - Scaling factor or scaling values in the x, y, and z directions.
      * @returns {number[]} - The 4x4 scale matrix.
      */
      export function scale(scale: number | Point): number[]{
            if(typeof scale === 'number'){
                  return [
                        scale, 0, 0, 0,
                        0, scale, 0, 0,
                        0, 0, scale, 0,
                        0, 0, 0, 1,
                  ]
            }
            return [
                  scale.x, 0, 0, 0,
                  0, scale.y, 0, 0,
                  0, 0, scale.z, 0,
                  0, 0, 0, 1,
            ]
      }
      /**
      * Generates a 4x4 perspective projection matrix.
      * @param {number} fieldOfView - Field of view angle in degrees.
      * @param {number} resolution - Aspect ratio (width/height).
      * @param {number} near - Near clipping plane.
      * @param {number} far - Far clipping plane.
      * @param {boolean} toRad - Whether the input field of view angle is in radians (default is true).
      * @returns {number[]} - The 4x4 perspective projection matrix.
      */
      export function prospective(fieldOfView: number, resolution: number, near: number, far: number, toRad: boolean = true) {
            if(toRad) fieldOfView = degToRad(fieldOfView);
            const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfView);
            const rangeInv = 1.0 / (near - far);
         
            return [
              f / resolution, 0, 0, 0,
              0, f, 0, 0,
              0, 0, (near + far) * rangeInv, -1,
              0, 0, near * far * rangeInv * 2, 0
            ];
      }
      export const IDENTITY_4X4 = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
      ]
      // ... (other utility functions)

      /**
      * Computes the dot product of two matrices.
      * @param {number[]} m1 - First matrix represented as a flat array.
      * @param {number} col1 - Number of columns in the first matrix.
      * @param {number[]} m2 - Second matrix represented as a flat array.
      * @returns {number[]} - Resulting matrix of the dot product.
      */
      export function dot(m1: number[], col1: number, m2: number[]): number[] {
            const res: number[] = [];
            const row1 = m1.length/col1;
            const row2 = col1;
            const col2 = m2.length/row2;
            if(!Number.isInteger(row1)){
                  throw "Invalid column number for matrix 1";
            }
            if(!Number.isInteger(row2)){
                  throw "Invalid column number for matrix 2";
            }
            if(row2 != col1){
                  throw "Invalid matrix. number of columns of the first matrix must be equal to the number of rows of the second matrix";
            }
            for(let i = 0; i < row1; i++){
                  for(let j = 0; j < col2; j++){
                        let sum = 0;
                        for(let k = 0; k < row2; k++){
                              sum += m1[i*col1 + k]*m2[k*col2 + j];
                        }
                        res[i*col2 + j] = sum;
                  }
            }
            return res;
      }
      export const composeMatrix = dot;
      
      /**
      * Computes the inverse of a square matrix represented as a flat array.
      * @param {number[]} mat - The input matrix represented as a flat array.
      * @param {number} col - Number of columns in the matrix.
      * @returns {number[]} - The inverse of the matrix represented as a flat array.
      */
      export function invert(mat: number[], col: number): number[] {
            // Convert the flat array to a 2D array (matrix).
            let m: number[][] = toMatrix(mat, col);
      
            // Create an identity matrix with the same dimensions as the input matrix.
            let I = identityMatrix(col);
      
            // Apply Gaussian elimination and backward substitution to find the inverse.
            m = backwardTransformation(gaussJordan(m, I));
            I = backwardTransformation(I);
            m = gaussJordan(m, I);
            m = backwardTransformation(m);
            I = backwardTransformation(I);
      
            // Normalize the resulting matrix by dividing each element by its main diagonal element.
            for (let i = 0; i < m.length; i++) {
            if (!m[i][i]) {
                  // If the main diagonal element is zero, the matrix is singular, and inversion is not possible.
                  console.warn(`Cannot invert the matrix ${mat}`);
                  return mat;
            }
            for (let j = 0; j < I[i].length; j++) {
                  I[i][j] /= m[i][i];
            }
            }
      
            // Convert the inverse matrix to a flat array and return it.
            return flat(I);
      }

      /**
      * Flattens a 2D array (matrix) into a 1D array.
      * @param {number[][]} m - The input 2D array.
      * @returns {number[]} - The flattened 1D array.
      */
      export function flat(m: number[][]): number[] {
            const res: number[] = [];
            m.forEach(el => res.push(...el));
            return res;
      }
      /**
      * Converts a matrix represented as a flat array to a 2D array.
      * @param {number[]} vec - Matrix represented as a flat array.
      * @param {number} col - Number of columns in the matrix.
      * @returns {number[][]} - Matrix represented as a 2D array.
      */
      export function toMatrix(vec: number[], col: number): number[][] {
            const m: number[][] = [];
            const rows = vec.length/col;
            
            for(let i = 0; i < rows; i++){
                  m.push([]);
                  for(let j = 0; j < col; j++){
                        m[i][j] = vec[i*col + j];
                  }
            }
            return m;
      }
      function gaussJordan(mat: number[][], mat2?: number[][]): number[][]{
            const m: number[][] = [...mat];
            for(let i = 0; i < m.length; i++) {
                  for(let j = i + 1; j < m.length; j++) {
                        mat2 && (mat2[j] = combine(mat2[i], mat2[j], m[j][i], -m[i][i]));
                        m[j] = combine(m[i], m[j], m[j][i], -m[i][i]);
                  }
            }
            return m;
      }
      function backwardTransformation(mat: number[][]){
            const m: number[][] = [];
            for(let i = mat.length - 1; i >= 0; i--) {
                  m.push([]);
                  for(let j = mat[i].length - 1; j >= 0; j--) {
                        m[mat.length - 1 - i].push(mat[i][j]);
                  }
            }
            return m;
      }
      function combine(v1: number[], v2: number[], k1: number = 1, k2: number = 1){
            const res = [];
            for(let i = 0; i < v1.length; i++){
                  res.push(v1[i]*k1 + v2[i]*k2);
            }
            return res;
      }
      export function identityMatrix(n: number): number[][] {
            const res: number[][] = [];
            for(let i = 0; i < n; i++) {
                  res.push([]);
                  for(let j = 0; j < n; j++) {
                        if(j === i){
                              res[i].push(1);
                              continue;
                        }
                        res[i].push(0);

                  }
            }
            return res;
      }
      /**
      * Calculates the determinant of a square matrix.
      * @param {number[][]} mat - The input square matrix.
      * @returns {number} - The determinant of the matrix.
      */
      export function det(mat: number[][]): number {
            const i = 0;
            const m = [...mat];
            let d = 0;
            for(let j = 0; j < m[i].length; j++){
                  if(m.length != m[j].length) throw 'cannot invoke this method (Matrix.det) on non square matrix';
                  const subMatrix = deleteRowAndCol(m, i, j);
                  const currentDet = (m[j].length > 3)? det(subMatrix) : det2x2(subMatrix);
                  d += (-1)**(i+j) * currentDet * m[i][j];
            }
            return d;
      }
      export function det2x2(m: number[][]): number {
            return m[0][0]*m[1][1] - m[0][1]*m[1][0];
      }
      /**
      * Transposes a square matrix represented as a 2D array.
      * @param {number[][]} m - The input square matrix.
      * @returns {number[][]} - The transposed matrix.
      */
      export function transposeMatrix(m: number[][]): number[][] {
            const T: number[][] = [];
            for(let i = 0; i < m.length; i++){
                  T.push([]);
                  for(let j = 0; j < m[i].length; j++){
                        T[j][i] = m[i][j]
                  }
            }
            return T;
      }
      /**
      * Converts a matrix represented as a flat array to its transpose.
      * @param {number[]} m - Matrix represented as a flat array.
      * @param {number} col - Number of columns in the matrix.
      * @returns {number[]} - Transposed matrix represented as a flat array.
      */
      export function transpose(m: number[], col: number): number[] {
            const T: number[] = [];
            const rows = m.length/col;
            for(let i = 0; i < rows; i++){
                  for(let j = 0; j < col; j++){
                        T[j*col +i] = m[i*col + j];
                  }
            }
            return T;
      }
      /**
      * Deletes a specified row and column from a matrix.
      * @param {number[][]} m - The input matrix.
      * @param {number} row - Index of the row to delete.
      * @param {number} col - Index of the column to delete.
      * @returns {number[][]} - The resulting matrix after deletion.
      */
      export function deleteRowAndCol(m: number[][], row: number, col: number){
            const res: number[][] = []
            for(let i = 0, ii = 0; i < m.length; i++){
                  if(i == row) continue;
                  res.push([]);
                  for(let j = 0, jj = 0; j < m[i].length; j++){
                        if(j == col) continue;
                        res[ii][jj] = m[i][j];
                        jj++;
                  }
                  ii++;
            }
            return res;
      }
      /**
      * Substitutes a column in a matrix with a given vector.
      * @param {number[][]} m - The input matrix.
      * @param {number} col - Index of the column to substitute.
      * @param {number[]} vec - The vector to substitute into the column.
      * @returns {number[][]} - The resulting matrix after substitution.
      */
      export function substituteColumn(m: number[][], col: number, vec: number[]): number[][] {
            const res: number[][] = [];
            for(let el of m){
                  res.push([...el]);
            }
            for(let i = 0; i < res.length; i++){
                  res[i][col] = vec[i];
            }
            return res;
      }
      /**
      * Converts degrees to radians.
      * @param {number} deg - Angle in degrees.
      * @returns {number} - Angle in radians.
      */
      export function degToRad(deg: number): number {
            return deg * Math.PI / 180; 
      }
      
}


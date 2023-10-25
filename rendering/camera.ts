import { Point, Axis, AxisType } from "./generics.js";
import { Matrix } from "./matrices.js";

export class Camera{
      matrix: number[] = [];
      rotationAxis: AxisType = Axis.X;

      private _cameraAngle: number = 0;
      private _cameraPosition: Point = { x: 0, y: 0, z: 0 };


      set angle(deg: number){
            if(this._cameraAngle === deg) return;
            this._cameraAngle = deg;
            this.updateCameraMatrix();
      }
      get angle(){
            return this._cameraAngle;
      }
      set position(point: Point){
            if(
                  this._cameraPosition.x === point.x && 
                  this._cameraPosition.y === point.y && 
                  this._cameraPosition.z === point.z 
                  ) return;
            this._cameraPosition = point;
            this.updateCameraMatrix();
      }
      get position(){
            return this._cameraPosition;
      }

      set x(x: number){
            if(x === this._cameraPosition.x) return;
            this._cameraPosition.x = x;
            this.updateCameraMatrix();
      }
      get x(){
            return this._cameraPosition.x;
      }

      set y(y: number){
            if(y === this._cameraPosition.y) return;
            this._cameraPosition.y = y;
            this.updateCameraMatrix();
      }
      get y(){
            return this._cameraPosition.y;
      }

      set z(z: number){
            if(z === this._cameraPosition.z) return;
            this._cameraPosition.z = z;
            this.updateCameraMatrix();
      }
      get z(){
            return this._cameraPosition.z;
      }

      constructor(){
            this.updateCameraMatrix();
      }
      private updateCameraMatrix(){
            const camera = Matrix.composeMatrix(
                  Matrix.rotation(this._cameraAngle, this.rotationAxis),
                  4, 
                  Matrix.translate(this._cameraPosition)
            );
            this.matrix = Matrix.invert(camera, 4);
      }
}
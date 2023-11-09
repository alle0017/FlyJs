/**
* 
* @hideconstructor
*/
export class WebGLRenderer {

      gl: WebGLRenderingContext;
      constructor( cvs: HTMLCanvasElement ) {
            this.gl = cvs.getContext('webgl') as WebGLRenderingContext;
            if( !this.gl ){
                  throw 'No Context available';
            }
      }

      static new( cvs: HTMLCanvasElement ){
            return new WebGLRenderer( cvs );
      }
}
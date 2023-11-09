/**
*
* @hideconstructor
*/
export class WebGLRenderer {
    constructor(cvs) {
        this.gl = cvs.getContext('webgl');
        if (!this.gl) {
            throw 'No Context available';
        }
    }
    static new(cvs) {
        return new WebGLRenderer(cvs);
    }
}

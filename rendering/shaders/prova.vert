uniform mat4 bones[5];
mat4 skinning( vec4 weights, vec4 indices ) {
                  mat4 m = mat4(
                        0, 0, 0, 0,
                        0, 0, 0, 0,
                        0, 0, 0, 0,
                        0, 0, 0, 0
                        );
                  for( int i = 0; i < 4; i++ ) {
                        m+= bones[ int(indices[i]) ]*weights[i];
                  }
                  return m;
            }
            
            
            attribute vec3 vertex_position;
attribute vec4 sk_indices;
attribute vec4 weights;

            uniform mat4 perspective;
uniform mat4 transformation;


            

            void main() {
                   mat4 skinning_mat = skinning( weights, sk_indices );
                  gl_Position = perspective * transformation * skinning_mat * vec4(vertex_position, 1);
            }
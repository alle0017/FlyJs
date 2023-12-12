import { ShapesProperties, Point3D, Point2D } from "./types.js"

export namespace Shapes {

      export function triangle(): ShapesProperties {
            const vertices = [ 
                  0.25, -0.25, 0,
                  -0.25, -0.25, 0,
                  0, 0.25, 0,
            ]
            return {
                  vertices,
                  indices: [ 0, 1, 2 ]
            }
      }
      export function rectangle( width?: number, height?: number, center?: Point3D | Point2D ): ShapesProperties {
            const vertices = [
                  -1, -1, 0,
                  1, -1, 0,
                  1,  1, 0,
                  -1,  1, 0,
            ]
            if( width ){
                  if( !height )
                        height = width;
                  width /= 2;
                  height /= 2;
                  vertices.forEach(( _: number, i: number, arr: number[] ) =>{ 
                        if( !(i%3) )
                              arr[i] *= width as number;
                        else if( i%3 == 1 )
                              arr[i] *= height as number;
                  })
            }
            if( center ){
                  vertices.forEach(( _: number, i: number, arr: number[] ) =>{ 
                        if( !(i%3) )
                              arr[i] += center.x;
                        else if( i%3 == 1 )
                              arr[i] += center.y;
                        else if( 'z' in center )
                              arr[i] += center.z
                  })
            }
            return {
                  indices: [ 0, 1, 2, 0, 2, 3 ],
                  vertices
            }
      }
      export function cube( side?: number, center?: Point3D ): ShapesProperties {
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
            ]
            if( side ){
                  vertices.forEach(( _: number, i: number, arr: number[] ) =>{ arr[i]*= side })
            }
            if( center ){
                  vertices.forEach(( _: number, i: number, arr: number[] ) =>{ 
                        if( !(i%3) )
                              arr[i] += center.x;
                        else if( i%3 == 1 )
                              arr[i] += center.y;
                        else 
                              arr[i] += center.z
                  })
            }
            return {
                  indices: [
                        0,
                        1,
                        2,
                        0,
                        2,
                        3, // front
                        4,
                        5,
                        6,
                        4,
                        6,
                        7, // back
                        8,
                        9,
                        10,
                        8,
                        10,
                        11, // top
                        12,
                        13,
                        14,
                        12,
                        14,
                        15, // bottom
                        16,
                        17,
                        18,
                        16,
                        18,
                        19, // right
                        20,
                        21,
                        22,
                        20,
                        22,
                        23,
                  ],
                  vertices
            }
      }
      export function parallelepiped( width?: number, height?: number, depth?: number, center?: Point3D ): ShapesProperties {
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
            ]
            if( width ){
                  if( !height )
                        height = width;
                  if( !depth ) 
                        depth = height;
                  width /= 2;
                  height /= 2;
                  depth /= 2;
                  vertices.forEach(( _: number, i: number, arr: number[] ) =>{ 
                        if( !(i%3) )
                              arr[i] *= width as number;
                        else if( i%3 == 1 )
                              arr[i] *= height as number;
                        else 
                              arr[i] *= depth as number;
                  })
            }
            if( center ){
                  vertices.forEach(( _: number, i: number, arr: number[] ) =>{ 
                        if( !(i%3) )
                              arr[i] += center.x;
                        else if( i%3 == 1 )
                              arr[i] += center.y;
                        else 
                              arr[i] += center.z
                  })
            }
            return {
                  indices: [
                        0,
                        1,
                        2,
                        0,
                        2,
                        3, // front
                        4,
                        5,
                        6,
                        4,
                        6,
                        7, // back
                        8,
                        9,
                        10,
                        8,
                        10,
                        11, // top
                        12,
                        13,
                        14,
                        12,
                        14,
                        15, // bottom
                        16,
                        17,
                        18,
                        16,
                        18,
                        19, // right
                        20,
                        21,
                        22,
                        20,
                        22,
                        23,
                  ],
                  vertices
            }
      }
      function dist( arr: number[], start: number ) {
            return ( arr[ start ]**2 + arr[ start + 1 ]**2 + arr[ start + 2 ]**2 ) ** 0.5
      }
      export function getExtremes( vertices: number[] ): {
            max: Point3D,
            min: Point3D
      } {
            if( vertices.length < 3 ){
                  return {
                        max: {
                              x: 0,
                              y: 0,
                              z: 0,
                        },
                        min: {
                              x: 0,
                              y: 0,
                              z: 0,
                        }
                  }
            }
            let maxDist = dist( vertices, 0 );
            let minDist = maxDist;
            let max = 0;
            let min = 0;
             
            for( let i = 3; i < vertices.length; i+=3 ){
                  const tmp = dist( vertices, i );
                  if( tmp < minDist ){
                        minDist = tmp;
                        min = i;
                  } else if( tmp > maxDist ){
                        maxDist = tmp;
                        max = i;
                  }
            }

            return {
                  max: {
                        x: vertices[max],
                        y: vertices[max + 1],
                        z: vertices[max + 2],
                  },
                  min: {
                        x: vertices[min],
                        y: vertices[min + 1],
                        z: vertices[min + 2],
                  },
            }
      }
}
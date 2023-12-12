import { GameController } from "../controller/gameController.js";
import { Point3D } from "../rendering/types.js";
import { Entity } from "../entities/entity.js";
const game = await GameController.get();
export namespace Collisions {
      function checkEntity( e: Entity ): boolean {
            const cameraX = e.renderable.attributes.camera?.x || 0;
            const cameraY = e.renderable.attributes.camera?.y || 0;
            const cameraZ = e.renderable.attributes.camera?.z || 0;
            return e.x + cameraX < 1;
      }
      function checkChunk( position: Point3D, chunkWidth: number, chunkHeight: number, chunkDepth: number ) {
            
            return (
                  game.scene && game.scene.cameraPosition &&
                  // checking for x
                  position.x < game.scene.cameraPosition.x + chunkWidth &&
                  position.x > game.scene.cameraPosition.x - chunkWidth &&
                  // checking for y
                  position.y < game.scene.cameraPosition.y + chunkHeight &&
                  position.y > game.scene.cameraPosition.y - chunkHeight &&
                  //checking for z
                  position.z < - game.renderer.perspectiveCoords.near + chunkDepth + game.scene.cameraPosition.z &&
                  position.z > - game.renderer.perspectiveCoords.far - chunkDepth + game.scene.cameraPosition.z
                  ) ||
                  ( 
                  position.x > -chunkWidth &&
                  position.x < chunkWidth &&
                  position.y > -chunkHeight &&
                  position.y < chunkHeight &&
                  position.z > -chunkDepth - game.renderer.perspectiveCoords.near &&
                  position.z < chunkDepth + game.renderer.perspectiveCoords.far
                  ) as boolean;
      }
      export function isOnScreen( position: Point3D ): boolean {
            return checkChunk( position, 1, 1, 1 )
      }
      export function isOnChunk( position: Point3D, chunkDimension: Point3D = { x: 2, y: 2, z: 2 } ){
            return checkChunk( position, chunkDimension.x, chunkDimension.y, chunkDimension.z );
      }
}
import { GameController } from "../controller/gameController.js";
const game = await GameController.get();
export var Collisions;
(function (Collisions) {
    function checkEntity(e) {
        var _a, _b, _c;
        const cameraX = ((_a = e.renderable.attributes.camera) === null || _a === void 0 ? void 0 : _a.x) || 0;
        const cameraY = ((_b = e.renderable.attributes.camera) === null || _b === void 0 ? void 0 : _b.y) || 0;
        const cameraZ = ((_c = e.renderable.attributes.camera) === null || _c === void 0 ? void 0 : _c.z) || 0;
        return e.x + cameraX < 1;
    }
    function checkChunk(position, chunkWidth, chunkHeight, chunkDepth) {
        return (game.scene && game.scene.cameraPosition &&
            // checking for x
            position.x < game.scene.cameraPosition.x + chunkWidth &&
            position.x > game.scene.cameraPosition.x - chunkWidth &&
            // checking for y
            position.y < game.scene.cameraPosition.y + chunkHeight &&
            position.y > game.scene.cameraPosition.y - chunkHeight &&
            //checking for z
            position.z < -game.renderer.perspectiveCoords.near + chunkDepth + game.scene.cameraPosition.z &&
            position.z > -game.renderer.perspectiveCoords.far - chunkDepth + game.scene.cameraPosition.z) ||
            (position.x > -chunkWidth &&
                position.x < chunkWidth &&
                position.y > -chunkHeight &&
                position.y < chunkHeight &&
                position.z > -chunkDepth - game.renderer.perspectiveCoords.near &&
                position.z < chunkDepth + game.renderer.perspectiveCoords.far);
    }
    function isOnScreen(position) {
        return checkChunk(position, 1, 1, 1);
    }
    Collisions.isOnScreen = isOnScreen;
    function isOnChunk(position, chunkDimension = { x: 2, y: 2, z: 2 }) {
        return checkChunk(position, chunkDimension.x, chunkDimension.y, chunkDimension.z);
    }
    Collisions.isOnChunk = isOnChunk;
})(Collisions || (Collisions = {}));

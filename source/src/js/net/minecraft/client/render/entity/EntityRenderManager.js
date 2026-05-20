import PlayerRenderer from "/src/js/net/minecraft/client/render/entity/entity/PlayerRenderer.js";
import PlayerEntity from "/src/js/net/minecraft/client/entity/PlayerEntity.js";
import PlayerEntityMultiplayer from "/src/js/net/minecraft/client/entity/PlayerEntityMultiplayer.js";
import BallEntity from "/src/js/net/minecraft/client/entity/BallEntity.js";
import BallRenderer from "/src/js/net/minecraft/client/render/entity/entity/BallRenderer.js";

export default class EntityRenderManager {

    constructor(worldRenderer) {
        this.worldRenderer = worldRenderer;

        this.renderers = [];
        this.push(PlayerEntity, PlayerRenderer);
        this.push(PlayerEntityMultiplayer, PlayerRenderer);
        this.push(BallEntity, BallRenderer);
    }

    push(entityType, entityRenderer) {
        this.renderers[entityType.name] = entityRenderer;
    }

    createEntityRendererByEntity(entity) {
        if (!(entity.constructor.name in this.renderers)) {
            return null;
        }
        return new this.renderers[entity.constructor.name]["prototype"]["constructor"](this.worldRenderer);
    }
}
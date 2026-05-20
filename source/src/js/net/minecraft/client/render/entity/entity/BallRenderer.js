import * as THREE from "/libraries/three.module.js";
import EntityRenderer from "/src/js/net/minecraft/client/render/entity/EntityRenderer.js";

export default class BallRenderer extends EntityRenderer {

    constructor(worldRenderer) {
        super(null);
        this.worldRenderer = worldRenderer;
        this.init();
    }

    init() {
        this.geometry = new THREE.SphereGeometry(0.25, 16, 16);
        
        let ballTexture = this.worldRenderer.minecraft.getThreeTexture('entity/football.png');
        if (ballTexture) {
            ballTexture.magFilter = THREE.NearestFilter;
            ballTexture.minFilter = THREE.NearestFilter;
        }

        this.material = new THREE.MeshBasicMaterial({
            map: ballTexture,
            color: 0xFFFFFF
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.group.add(this.mesh);
        this.mesh.position.y = 0.25; 
    }

    render(entity, partialTicks) {
        let interpolatedX = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        let interpolatedY = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        let interpolatedZ = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;

        this.group.position.set(interpolatedX, interpolatedY, interpolatedZ);
        this.group.scale.set(1, 1, 1);
    }
}

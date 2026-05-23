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

        let ballTexture = this.worldRenderer.minecraft.getThreeTexture('entity/football_2.png');
        let ballBumpMap = this.worldRenderer.minecraft.getThreeTexture('entity/football_bump.png');

        if (ballTexture) {
            ballTexture.magFilter = THREE.NearestFilter;
            ballTexture.minFilter = THREE.NearestFilter;
        }

        // MeshStandardMaterial de nhan anh sang tu AmbientLight / DirectionalLight / SpotLight
        this.material = new THREE.MeshStandardMaterial({
            map: ballTexture,
            bumpMap: ballBumpMap,
            bumpScale: 0.05,
            color: 0xFFFFFF,
            roughness: 0.6,
            metalness: 0.1
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

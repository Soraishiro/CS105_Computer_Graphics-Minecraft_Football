import * as THREE from "../../../../../../libraries/three.module.js";
import EntityRenderer from "./EntityRenderer.js";

export default class BallRenderer extends EntityRenderer {

    constructor(worldRenderer) {
        super(worldRenderer);
    }

    init() {
        // Create a sphere geometry for the ball
        // 0.25 radius (since width/height in BallEntity is 0.5)
        this.geometry = new THREE.SphereGeometry(0.25, 16, 16);
        
        // Use a white material for the ball (soccer ball style)
        this.material = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.7,
            metalness: 0.1
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.group.add(this.mesh);
        
        // Adjust group pivot if needed (Entity.js expects y at bottom)
        this.mesh.position.y = 0.25; 
    }

    render(entity, partialTicks) {
        super.render(entity, partialTicks);
        
        // Update mesh position based on entity
        // The base class handles translation, but we can add rotation here later
        // if we want the ball to roll realistically.
    }
}

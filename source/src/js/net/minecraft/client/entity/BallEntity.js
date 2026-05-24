import Entity from "/src/js/net/minecraft/client/entity/Entity.js";
import MathHelper from "/src/js/net/minecraft/util/MathHelper.js";
import { BlockRegistry } from "/src/js/net/minecraft/client/world/block/BlockRegistry.js";
import * as THREE from "/libraries/three.module.js";

export default class BallEntity extends Entity {

    constructor(minecraft, world, id) {
        super(minecraft, world, id);

        this.width = 0.5;
        this.height = 0.5;
        this.restitution = 0.7; // Hệ số nảy (0.0 - 1.0)
        this.friction = 0.98;    // Ma sát mặt đất
        this.airResistance = 0.98; // Lực cản không khí

        this.rollQuat = new THREE.Quaternion();
        this.prevRollQuat = new THREE.Quaternion();
        this.rollAxis = new THREE.Vector3();
        this.rollDeltaQuat = new THREE.Quaternion();
        
        this.setPosition(0, 70, 0); // Spawn bổng lên chút để thấy nó rơi và nảy
    }

    onUpdate() {
        super.onUpdate();

        this.prevRollQuat.copy(this.rollQuat);

        // Trọng lực
        this.motionY -= 0.04;

        // Cản không khí
        this.motionX *= this.airResistance;
        this.motionY *= 0.98; // Trọng lực + cản
        this.motionZ *= this.airResistance;

        // Lưu lại vận tốc trước khi va chạm để tính toán nảy
        let prevMotionX = this.motionX;
        let prevMotionY = this.motionY;
        let prevMotionZ = this.motionZ;

        // Thực hiện di chuyển và va chạm với block
        this.moveCollide(this.motionX, this.motionY, this.motionZ);

        // Logic nảy
        if (Math.abs(prevMotionX - this.motionX) > 0.001) {
            this.motionX = -prevMotionX * this.restitution;
        }
        if (Math.abs(prevMotionY - this.motionY) > 0.001) {
            this.motionY = -prevMotionY * this.restitution;
            // Dừng nảy nếu vận tốc quá thấp để tránh rung (jitter)
            if (Math.abs(this.motionY) < 0.05) this.motionY = 0;
        }
        if (Math.abs(prevMotionZ - this.motionZ) > 0.001) {
            this.motionZ = -prevMotionZ * this.restitution;
        }

        // Ma sát mặt đất
        if (this.onGround) {
            let groundFriction = this.getGroundFriction();
            this.motionX *= groundFriction;
            this.motionZ *= groundFriction;
        }

        // Roll rotation khi bóng lăn trên mặt đất
        this.updateRollRotation();

        // Va chạm với Player
        this.checkPlayerCollision();

        // Va chạm riêng với khung thành
        this.handleGoalCollision();
    }

    getGroundFriction() {
        let groundFriction = this.friction;
        if (this.world && this.world.isRaining) {
            let rainStrength = this.world.rainStrength || 0.0;
            groundFriction = Math.min(1.0, groundFriction + 0.02 * rainStrength);
        }
        return groundFriction;
    }

    updateRollRotation() {
        if (!this.onGround) {
            return;
        }

        let dx = this.x - this.prevX;
        let dz = this.z - this.prevZ;
        let distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < 0.0001) {
            return;
        }

        let radius = this.width / 2;
        let angle = distance / radius;

        this.rollAxis.set(dz, 0, -dx);
        if (this.rollAxis.lengthSq() < 0.000001) {
            return;
        }

        this.rollAxis.normalize();
        this.rollDeltaQuat.setFromAxisAngle(this.rollAxis, angle);
        this.rollQuat.multiply(this.rollDeltaQuat).normalize();
    }

    checkPlayerCollision() {
        let player = this.minecraft.player;
        if (!player) return;

        // Khoảng cách giữa tâm bóng và tâm player (AABB check đơn giản)
        if (this.boundingBox.intersects(player.boundingBox)) {
            // Tính hướng đẩy từ player đến bóng
            let dx = this.x - player.x;
            let dz = this.z - player.z;
            let length = Math.sqrt(dx * dx + dz * dz);

            if (length > 0) {
                dx /= length;
                dz /= length;

                // Truyền vận tốc từ player sang bóng (kick!)
                let kickPower = 0.1;
                this.motionX += dx * kickPower;
                this.motionZ += dz * kickPower;

                this.minecraft.soundManager.playSound("random.soccer_kick", this.x, this.y, this.z, 1.0, 1.0);
                
                // Hơi nảy lên một chút nếu đang ở gần chân
                if (this.onGround) {
                    this.motionY = 0.2;
                }
            }
        }
    }

    handleGoalCollision() {
        if (!this.world) {
            return;
        }

        let goalPostId = BlockRegistry.GOAL_POST.getId();
        let goalNetId = BlockRegistry.GOAL_NET.getId();

        let minX = Math.floor(this.boundingBox.minX) - 1;
        let maxX = Math.floor(this.boundingBox.maxX) + 1;
        let minY = Math.floor(this.boundingBox.minY) - 1;
        let maxY = Math.floor(this.boundingBox.maxY) + 1;
        let minZ = Math.floor(this.boundingBox.minZ) - 1;
        let maxZ = Math.floor(this.boundingBox.maxZ) + 1;

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    let typeId = this.world.getBlockAt(x, y, z);
                    if (typeId !== goalPostId && typeId !== goalNetId) {
                        continue;
                    }

                    let isNet = typeId === goalNetId;
                    if (this.resolveGoalBlockCollision(x, y, z, isNet)) {
                        return;
                    }
                }
            }
        }
    }

    resolveGoalBlockCollision(blockX, blockY, blockZ, isNet) {
        let minX = blockX;
        let maxX = blockX + 1;
        let minY = blockY;
        let maxY = blockY + 1;
        let minZ = blockZ;
        let maxZ = blockZ + 1;

        let box = this.boundingBox;
        let overlapX = Math.min(box.maxX, maxX) - Math.max(box.minX, minX);
        let overlapY = Math.min(box.maxY, maxY) - Math.max(box.minY, minY);
        let overlapZ = Math.min(box.maxZ, maxZ) - Math.max(box.minZ, minZ);

        if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) {
            return false;
        }

        let minOverlap = Math.min(overlapX, overlapY, overlapZ);
        let centerX = (box.minX + box.maxX) * 0.5;
        let centerY = (box.minY + box.maxY) * 0.5;
        let centerZ = (box.minZ + box.maxZ) * 0.5;
        let blockCenterX = blockX + 0.5;
        let blockCenterY = blockY + 0.5;
        let blockCenterZ = blockZ + 0.5;

        let restitution = isNet ? 0.2 : this.restitution;

        if (minOverlap === overlapX) {
            let direction = centerX < blockCenterX ? -1 : 1;
            this.setPosition(this.x + direction * (minOverlap + 0.001), this.y, this.z);
            this.motionX = -this.motionX * restitution;
        } else if (minOverlap === overlapY) {
            let direction = centerY < blockCenterY ? -1 : 1;
            this.setPosition(this.x, this.y + direction * (minOverlap + 0.001), this.z);
            this.motionY = -this.motionY * restitution;
        } else {
            let direction = centerZ < blockCenterZ ? -1 : 1;
            this.setPosition(this.x, this.y, this.z + direction * (minOverlap + 0.001));
            this.motionZ = -this.motionZ * restitution;
        }

        if (isNet) {
            this.motionX *= 0.6;
            this.motionY *= 0.6;
            this.motionZ *= 0.6;
        }

        return true;
    }
}

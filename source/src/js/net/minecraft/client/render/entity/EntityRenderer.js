import Tessellator from "../Tessellator.js";
import MathHelper from "../../../util/MathHelper.js";
import * as THREE from "../../../../../../../libraries/three.module.js";

export default class EntityRenderer {
  constructor(model) {
    this.model = model;
    this.tessellator = new Tessellator();
    this.group = new THREE.Object3D();
  }

  rebuild(entity) {
    // Create meta for group
    let meta = {};
    this.fillMeta(entity, meta);
    this.group.buildMeta = meta;

    // Clear meshes
    this.group.clear();

    // Apply brightness and rebuild
    let brightness = this.group.buildMeta.brightness;
    this.tessellator.setColor(brightness, brightness, brightness);
    this.model.rebuild(this.tessellator, this.group);

    // Bat castShadow cho tat ca cac bo phan cua entity (tay, chan, than, dau...)
    this.group.traverse((child) => {
      if (child.isMesh) {
        if (entity.isSpectator) {
          // Fast WebGL path for spectators: keep lightweight MeshBasicMaterial
          // and disable soft dynamic shadow casting to restore buttery-smooth 60+ FPS!
          child.castShadow = false;
          child.receiveShadow = false;
          // Disable per-mesh frustum culling. Player models are split into
          // sub-meshes (head, body, arms, legs) and Three.js was culling
          // individual parts whose local bounding sphere fell outside the
          // frustum even when the entity itself was on-screen, producing
          // headless / legless spectators at close range.
          child.frustumCulled = false;
          return;
        }

        child.castShadow = true;
        child.receiveShadow = true; // Cho phep nhan bong cua chinh no

        // Thu doi sang MeshStandardMaterial giong nhu qua bong de ho tro anh sang/bong do Three.js
        if (child.material && child.material.type === "MeshBasicMaterial") {
          child.geometry.computeVertexNormals();

          let oldMaterial = child.material;
          child.material = new THREE.MeshStandardMaterial({
            map: oldMaterial.map,
            color: 0xffffff,
            transparent: true,
            alphaTest: 0.1,
            vertexColors: false,
            roughness: 0.8,
          });

          oldMaterial.dispose();
        }
      }
    });
  }

  fillMeta(entity, meta) {
    meta.brightness = entity.getEntityBrightness();
  }

  isRebuildRequired(entity) {
    if (typeof this.group.buildMeta === "undefined") {
      return true;
    }

    // Spectators never move and never need lighting-driven rebuilds. The
    // brightness diff would otherwise tick every frame during day/night blend
    // and rebuild all 600 spectator meshes — wasted work that can also cause
    // momentary geometry flicker.
    if (entity.isSpectator) {
      return false;
    }

    // Compare meta of group
    let currentMeta = {};
    this.fillMeta(entity, currentMeta);
    let previousMeta = this.group.buildMeta;
    return JSON.stringify(currentMeta) !== JSON.stringify(previousMeta);
  }

  render(entity, partialTicks) {
    this.prepareModel(entity);

    let rotationBody = this.interpolateRotation(
      entity.prevRenderYawOffset,
      entity.renderYawOffset,
      partialTicks,
    );
    let rotationHead = this.interpolateRotation(
      entity.prevRotationYawHead,
      entity.rotationYawHead,
      partialTicks,
    );

    let limbSwingStrength =
      entity.prevLimbSwingStrength +
      (entity.limbSwingStrength - entity.prevLimbSwingStrength) * partialTicks;
    let limbSwing =
      entity.limbSwingProgress -
      entity.limbSwingStrength * (1.0 - partialTicks);

    let yaw = rotationHead - rotationBody;
    let pitch =
      entity.prevRotationPitch +
      (entity.rotationPitch - entity.prevRotationPitch) * partialTicks;

    // Interpolate entity position
    let interpolatedX = entity.prevX + (entity.x - entity.prevX) * partialTicks;
    let interpolatedY = entity.prevY + (entity.y - entity.prevY) * partialTicks;
    let interpolatedZ = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;

    // Translate using interpolated position
    this.group.position.setX(interpolatedX);
    this.group.position.setY(interpolatedY + 1.4);
    this.group.position.setZ(interpolatedZ);

    // Actual size of the entity
    let scale = 7.0 / 120.0;
    this.group.scale.set(-scale, -scale, scale);

    // Rotate entity model
    this.group.rotation.y = MathHelper.toRadians(-rotationBody + 180);

    // Render entity model
    let timeAlive = entity.ticksExisted + partialTicks;
    let stack = entity.renderer.group;
    this.model.render(
      stack,
      limbSwing,
      limbSwingStrength,
      timeAlive,
      yaw,
      pitch,
      partialTicks,
    );
  }

  interpolateRotation(prevValue, value, partialTicks) {
    let factor;
    for (factor = value - prevValue; factor < -180.0; factor += 360.0) {}
    while (factor >= 180.0) {
      factor -= 360.0;
    }
    return prevValue + partialTicks * factor;
  }

  prepareModel(entity) {
    if (this.isRebuildRequired(entity)) {
      this.rebuild(entity);
    }
  }
}

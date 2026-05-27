import ModelMob from "../../model/model/ModelMob.js";
import ModelPlayer from "../../model/model/ModelPlayer.js?v=4";
import EntityRenderer from "../EntityRenderer.js";
import Block from "../../../world/block/Block.js";
import * as THREE from "../../../../../../../../libraries/three.module.js";

export default class PlayerRenderer extends EntityRenderer {
  constructor(worldRenderer) {
    super(new ModelPlayer());

    this.worldRenderer = worldRenderer;

    // Load character texture
    this.textureCharacter = worldRenderer.minecraft.getThreeTexture(
      "2026_05_12_ahmad-jamal-24047479.png",
    );
    if (this.textureCharacter) {
      this.textureCharacter.magFilter = THREE.NearestFilter;
      this.textureCharacter.minFilter = THREE.NearestFilter;
    }

    // Load referee texture
    this.textureReferee = worldRenderer.minecraft.getThreeTexture(
      "2025_04_12_italian-referee-23186559.png",
    );
    if (this.textureReferee) {
      this.textureReferee.magFilter = THREE.NearestFilter;
      this.textureReferee.minFilter = THREE.NearestFilter;
    }

    // Load Barcelona texture
    this.textureBarcelona = worldRenderer.minecraft.getThreeTexture(
      "2026_03_01_messi-2018--remake--23896589.png",
    );
    if (this.textureBarcelona) {
      this.textureBarcelona.magFilter = THREE.NearestFilter;
      this.textureBarcelona.minFilter = THREE.NearestFilter;
    }

    // Load Real Madrid texture
    this.textureRealMadrid = worldRenderer.minecraft.getThreeTexture(
      "2025_11_29_real-madrid-number-7-23682272.png",
    );
    if (this.textureRealMadrid) {
      this.textureRealMadrid.magFilter = THREE.NearestFilter;
      this.textureRealMadrid.minFilter = THREE.NearestFilter;
    }

    // First person right-hand holder
    this.handModel = null;
    this.firstPersonGroup = new THREE.Object3D();
    this.worldRenderer.overlay.add(this.firstPersonGroup);

    // Spectator mob textures cache
    this.spectatorTextures = {};
  }

  /**
   * Composite a (likely-transparent) source texture onto a flat-colour base
   * canvas. Returns a new THREE.Texture with the result. Used to recover
   * "overlay" mob textures like enderman that ship without a solid body
   * underneath. The output uses the source image's exact pixel dimensions
   * (NearestFilter friendly).
   */
  _compositeOnBase(sourceTex, baseColor) {
    const src = sourceTex.image;
    const canvas = document.createElement("canvas");
    canvas.width = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0);
    const tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  loadTextureFromUrl(url, fallbackTexture) {
    let texture = new THREE.Texture();
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      let canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      let ctx = canvas.getContext("2d");

      // Draw original skin image
      ctx.drawImage(image, 0, 0);

      texture.image = canvas;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
    };
    image.onerror = () => {
      // Explicit offline & download fallback
      if (fallbackTexture && fallbackTexture.image) {
        texture.image = fallbackTexture.image;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
      }
    };
    image.src = url;
    return texture;
  }

  rebuild(entity) {
    let isSelf = entity === this.worldRenderer.minecraft.player;
    let firstPerson =
      this.worldRenderer.minecraft.settings.thirdPersonView === 0;
    let itemId =
      firstPerson && isSelf
        ? this.worldRenderer.itemToRender
        : entity.inventory.getItemInSelectedSlot();
    let hasItem = itemId !== 0;

    if (firstPerson && hasItem && isSelf) {
      super.rebuild(entity);

      // Create new item group and add it to the hand
      this.firstPersonGroup.clear();
      let itemGroup = new THREE.Object3D();
      this.firstPersonGroup.add(itemGroup);

      // Render item in hand in first person
      let block = Block.getById(itemId);
      this.worldRenderer.blockRenderer.renderBlockInFirstPerson(
        itemGroup,
        block,
        entity.getEntityBrightness(),
      );

      // Copy material and update depth test of the item to render it always in front
      let mesh = itemGroup.children[0];
      mesh.material = mesh.material.clone();
      mesh.material.depthTest = false;
    } else {
      if (entity.isSpectator) {
        let mobName = entity.username; // now plain: "cow", "pig", "creeper", etc.
        if (!(mobName in this.spectatorTextures)) {
          // Local vanilla mob texture paths (extracted from Minecraft 1.8 JAR)
          const MOB_TEXTURE_PATHS = {
            cow: "mob/cow/cow.png",
            pig: "mob/pig/pig.png",
            sheep: "mob/sheep/sheep.png",
            chicken: "mob/chicken.png",
            wolf: "mob/wolf/wolf.png",
            ocelot: "mob/ocelot.png",
            creeper: "mob/creeper/creeper.png",
            skeleton: "mob/skeleton/skeleton.png",
            zombie: "mob/zombie/zombie.png",
            enderman: "mob/enderman/enderman.png",
            villager: "mob/villager/villager.png",
            slime: "mob/slime/slime.png",
            magmacube: "mob/magmacube.png",
            squid: "mob/squid.png",
          };
          let texPath = MOB_TEXTURE_PATHS[mobName];
          let tex = texPath
            ? this.worldRenderer.minecraft.getThreeTexture(texPath)
            : null;
          if (tex) {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            // Some vanilla mob skins (notably enderman) ship as
            // an OVERLAY layer over a solid base — they're mostly
            // transparent on their own and rely on the entity's
            // dark body rendered underneath. We don't draw that
            // base layer, so we composite the texture onto a flat
            // background of the correct base colour here.
            const BASE_COLORS = {
              enderman: "#0c0c0c", // near-black ender body
            };
            if (BASE_COLORS[mobName]) {
              tex = this._compositeOnBase(tex, BASE_COLORS[mobName]);
              tex.magFilter = THREE.NearestFilter;
              tex.minFilter = THREE.NearestFilter;
            }
            this.spectatorTextures[mobName] = tex;
          } else {
            this.spectatorTextures[mobName] = this.textureCharacter; // fallback
          }
        }
        this.tessellator.bindTexture(this.spectatorTextures[mobName]);

        // Swap to proper custom mob model
        const customMobs = [
          "cow",
          "pig",
          "sheep",
          "chicken",
          "wolf",
          "ocelot",
          "villager",
          "creeper",
          "enderman",
          "squid",
          "slime",
          "magmacube",
          "skeleton",
          "zombie",
        ];
        if (customMobs.includes(mobName)) {
          if (
            !(this.model instanceof ModelMob) ||
            this.model.mobType !== mobName
          ) {
            this.model = new ModelMob(mobName);
          }
        } else {
          if (!(this.model instanceof ModelPlayer)) {
            this.model = new ModelPlayer();
          }
        }
      } else if (entity.isReferee && this.textureReferee) {
        this.tessellator.bindTexture(this.textureReferee);
        if (!(this.model instanceof ModelPlayer)) {
          this.model = new ModelPlayer();
        }
      } else if (entity.isBarcelona && this.textureBarcelona) {
        this.tessellator.bindTexture(this.textureBarcelona);
        if (!(this.model instanceof ModelPlayer)) {
          this.model = new ModelPlayer();
        }
      } else if (entity.isRealMadrid && this.textureRealMadrid) {
        this.tessellator.bindTexture(this.textureRealMadrid);
        if (!(this.model instanceof ModelPlayer)) {
          this.model = new ModelPlayer();
        }
      } else {
        this.tessellator.bindTexture(this.textureCharacter);
        if (!(this.model instanceof ModelPlayer)) {
          this.model = new ModelPlayer();
        }
      }
      super.rebuild(entity);

      // Render item in hand in third person
      if (hasItem && this.model.rightArm) {
        let block = Block.getById(itemId);
        let group = this.model.rightArm.bone;
        this.worldRenderer.blockRenderer.renderBlockInHandThirdPerson(
          group,
          block,
          entity.getEntityBrightness(),
        );
      }

      if (isSelf && this.model.rightArm) {
        // Create first person right hand and attach it to the holder
        this.firstPersonGroup.clear();
        this.handModel = this.model.rightArm.clone();
        this.firstPersonGroup.add(this.handModel.bone);

        // Copy material and update depth test of the hand to render it always in front
        let mesh = this.handModel.bone.children[0];
        if (mesh) {
          mesh.material = mesh.material.clone();
          mesh.material.depthTest = false;
        }
      }
    }
  }

  render(entity, partialTicks) {
    let swingProgress = entity.swingProgress - entity.prevSwingProgress;
    if (swingProgress < 0.0) {
      swingProgress++;
    }
    this.model.swingProgress =
      entity.prevSwingProgress + swingProgress * partialTicks;
    this.model.hasItemInHand = entity.inventory.getItemInSelectedSlot() !== 0;
    this.model.isSneaking = entity.isSneaking();

    // TODO find a better way
    if (entity !== this.worldRenderer.minecraft.player) {
      this.firstPersonGroup.visible = false;
    }

    super.render(entity, partialTicks);
  }

  updateFirstPerson(player) {
    // Make sure the model is created
    this.prepareModel(player);

    // Make the group visible
    this.firstPersonGroup.visible = true;
  }

  renderRightHand(player, partialTicks) {
    this.updateFirstPerson(player);

    // Set transform of renderer
    this.model.swingProgress = 0;
    this.model.hasItemInHand = false;
    this.model.isSneaking = false;
    this.model.setRotationAngles(player, 0, 0, 0, 0, 0, 0);
    if (this.handModel && this.model.rightArm) {
      this.handModel.copyTransformOf(this.model.rightArm);

      // Render hand model
      this.handModel.render();
    }
  }

  fillMeta(entity, meta) {
    super.fillMeta(entity, meta);

    let firstPerson =
      this.worldRenderer.minecraft.settings.thirdPersonView === 0;

    meta.firstPerson = firstPerson;
    meta.itemInHand = firstPerson
      ? this.worldRenderer.itemToRender
      : entity.inventory.getItemInSelectedSlot();
    meta.isReferee = !!entity.isReferee;
    meta.isBarcelona = !!entity.isBarcelona;
    meta.isRealMadrid = !!entity.isRealMadrid;
  }
}

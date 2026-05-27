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
        this.textureCharacter = worldRenderer.minecraft.getThreeTexture('2026_05_12_ahmad-jamal-24047479.png');
        if (this.textureCharacter) {
            this.textureCharacter.magFilter = THREE.NearestFilter;
            this.textureCharacter.minFilter = THREE.NearestFilter;
        }

        // Load referee texture
        this.textureReferee = worldRenderer.minecraft.getThreeTexture('2025_04_12_italian-referee-23186559.png');
        if (this.textureReferee) {
            this.textureReferee.magFilter = THREE.NearestFilter;
            this.textureReferee.minFilter = THREE.NearestFilter;
        }

        // Load Barcelona texture
        this.textureBarcelona = worldRenderer.minecraft.getThreeTexture('2026_03_01_messi-2018--remake--23896589.png');
        if (this.textureBarcelona) {
            this.textureBarcelona.magFilter = THREE.NearestFilter;
            this.textureBarcelona.minFilter = THREE.NearestFilter;
        }

        // Load Real Madrid texture
        this.textureRealMadrid = worldRenderer.minecraft.getThreeTexture('2025_11_29_real-madrid-number-7-23682272.png');
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

    loadTextureFromUrl(url, fallbackTexture) {
        let texture = new THREE.Texture();
        let image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            let canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            let ctx = canvas.getContext('2d');
            
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
        let firstPerson = this.worldRenderer.minecraft.settings.thirdPersonView === 0;
        let itemId = firstPerson && isSelf ? this.worldRenderer.itemToRender : entity.inventory.getItemInSelectedSlot();
        let hasItem = itemId !== 0;

        if (firstPerson && hasItem && isSelf) {
            super.rebuild(entity);

            // Create new item group and add it to the hand
            this.firstPersonGroup.clear();
            let itemGroup = new THREE.Object3D();
            this.firstPersonGroup.add(itemGroup);

            // Render item in hand in first person
            let block = Block.getById(itemId);
            this.worldRenderer.blockRenderer.renderBlockInFirstPerson(itemGroup, block, entity.getEntityBrightness());

            // Copy material and update depth test of the item to render it always in front
            let mesh = itemGroup.children[0];
            mesh.material = mesh.material.clone();
            mesh.material.depthTest = false;
        } else {
            if (entity.isSpectator) {
                let mobName = entity.username;
                if (!(mobName in this.spectatorTextures)) {
                    let skinUrl = "https://minotar.net/skin/" + mobName;
                    this.spectatorTextures[mobName] = this.loadTextureFromUrl(skinUrl, this.textureCharacter);
                }
                this.tessellator.bindTexture(this.spectatorTextures[mobName]);

                // Swap to proper custom mob model if it is an animal/mob type
                let mobType = mobName.replace("MHF_", "").toLowerCase();
                const customMobs = ["cow", "pig", "sheep", "chicken", "wolf", "ocelot", "villager", "creeper", "enderman", "squid", "slime", "lavaslime"];
                if (customMobs.includes(mobType)) {
                    if (!(this.model instanceof ModelMob) || this.model.mobType !== mobType) {
                        this.model = new ModelMob(mobType);
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
                this.worldRenderer.blockRenderer.renderBlockInHandThirdPerson(group, block, entity.getEntityBrightness());
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
        this.model.swingProgress = entity.prevSwingProgress + swingProgress * partialTicks;
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

        let firstPerson = this.worldRenderer.minecraft.settings.thirdPersonView === 0;

        meta.firstPerson = firstPerson;
        meta.itemInHand = firstPerson ? this.worldRenderer.itemToRender : entity.inventory.getItemInSelectedSlot();
        meta.isReferee = !!entity.isReferee;
        meta.isBarcelona = !!entity.isBarcelona;
        meta.isRealMadrid = !!entity.isRealMadrid;
    }

}
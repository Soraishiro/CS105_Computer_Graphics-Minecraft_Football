import ModelRenderer from "../renderer/ModelRenderer.js";
import MathHelper from "../../../../util/MathHelper.js";
import ModelBase from "../ModelBase.js";

/**
 * ModelMob — Supports all original Minecraft mob and animal shapes
 * with accurate texture coordinates and box dimensions!
 */
export default class ModelMob extends ModelBase {

    constructor(mobType) {
        super();
        this.mobType = mobType.toLowerCase();
        this.parts = {};
        this.initModel();
    }

    initModel() {
        const W = 64;
        const H = 64;

        switch (this.mobType) {
            case "creeper":
                // Head: 8x8x8 at (0, 0)
                this.parts["head"] = new ModelRenderer("head", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 6.0, 0.0)
                    .addBox(-4.0, -8.0, -4.0, 8, 8, 8);
                // Body: 8x12x4 at (16, 16)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(16, 16)
                    .setRotationPoint(0.0, 6.0, 0.0)
                    .addBox(-4.0, 0.0, -2.0, 8, 12, 4);
                // 4 legs: 4x6x4 at (0, 16)
                this.parts["leg1"] = new ModelRenderer("leg1", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(-2.0, 18.0, -4.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 6, 4);
                this.parts["leg2"] = new ModelRenderer("leg2", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(2.0, 18.0, -4.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 6, 4);
                this.parts["leg3"] = new ModelRenderer("leg3", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(-2.0, 18.0, 4.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 6, 4);
                this.parts["leg4"] = new ModelRenderer("leg4", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(2.0, 18.0, 4.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 6, 4);
                break;

            case "cow":
                // Head: 8x8x6 at (0, 0)
                this.parts["head"] = new ModelRenderer("head", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 4.0, -8.0)
                    .addBox(-4.0, -4.0, -6.0, 8, 8, 6);
                // Horns
                this.parts["horn1"] = new ModelRenderer("horn1", W, H)
                    .setTextureOffset(22, 0)
                    .addBox(-5.0, -5.0, -4.0, 1, 3, 1);
                this.parts["horn2"] = new ModelRenderer("horn2", W, H)
                    .setTextureOffset(22, 0)
                    .addBox(4.0, -5.0, -4.0, 1, 3, 1);
                this.parts["head"].addChild(this.parts["horn1"]);
                this.parts["head"].addChild(this.parts["horn2"]);

                // Body: 12x18x10 at (18, 4), oriented horizontally
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(18, 4)
                    .setRotationPoint(0.0, 12.0, 0.0)
                    .addBox(-6.0, -5.0, -9.0, 12, 10, 18);

                // 4 legs: 4x12x4 at (0, 16)
                this.parts["leg1"] = new ModelRenderer("leg1", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(-4.0, 12.0, -6.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                this.parts["leg2"] = new ModelRenderer("leg2", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(4.0, 12.0, -6.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                this.parts["leg3"] = new ModelRenderer("leg3", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(-4.0, 12.0, 6.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                this.parts["leg4"] = new ModelRenderer("leg4", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(4.0, 12.0, 6.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                break;

            case "pig":
                // Head: 8x8x8 at (0, 0)
                this.parts["head"] = new ModelRenderer("head", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 12.0, -6.0)
                    .addBox(-4.0, -4.0, -8.0, 8, 8, 8);
                // Snout
                this.parts["snout"] = new ModelRenderer("snout", W, H)
                    .setTextureOffset(16, 16)
                    .addBox(-2.0, 1.0, -9.0, 4, 3, 1);
                this.parts["head"].addChild(this.parts["snout"]);

                // Body: 10x8x16 at (28, 8)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(28, 8)
                    .setRotationPoint(0.0, 14.0, 0.0)
                    .addBox(-5.0, -4.0, -8.0, 10, 8, 16);

                // 4 legs: 4x6x4 at (0, 16)
                this.parts["leg1"] = new ModelRenderer("leg1", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(-3.0, 18.0, -5.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 6, 4);
                this.parts["leg2"] = new ModelRenderer("leg2", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(3.0, 18.0, -5.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 6, 4);
                this.parts["leg3"] = new ModelRenderer("leg3", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(-3.0, 18.0, 5.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 6, 4);
                this.parts["leg4"] = new ModelRenderer("leg4", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(3.0, 18.0, 5.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 6, 4);
                break;

            case "sheep":
                // Head: 8x8x8 at (0, 0)
                this.parts["head"] = new ModelRenderer("head", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 10.0, -6.0)
                    .addBox(-4.0, -4.0, -6.0, 8, 8, 8);
                // Body: 10x8x16 at (28, 8)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(28, 8)
                    .setRotationPoint(0.0, 12.0, 0.0)
                    .addBox(-5.0, -4.0, -8.0, 10, 8, 16);
                // 4 legs: 4x12x4 at (0, 16)
                this.parts["leg1"] = new ModelRenderer("leg1", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(-3.0, 12.0, -5.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                this.parts["leg2"] = new ModelRenderer("leg2", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(3.0, 12.0, -5.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                this.parts["leg3"] = new ModelRenderer("leg3", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(-3.0, 12.0, 5.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                this.parts["leg4"] = new ModelRenderer("leg4", W, H)
                    .setTextureOffset(0, 16)
                    .setRotationPoint(3.0, 12.0, 5.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                break;

            case "chicken":
                // Head: 4x6x3 at (0, 0)
                this.parts["head"] = new ModelRenderer("head", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 15.0, -4.0)
                    .addBox(-2.0, -6.0, -3.0, 4, 6, 3);
                // Bill
                this.parts["bill"] = new ModelRenderer("bill", W, H)
                    .setTextureOffset(14, 0)
                    .addBox(-2.0, -4.0, -5.0, 4, 2, 2);
                // Wattle
                this.parts["wattle"] = new ModelRenderer("wattle", W, H)
                    .setTextureOffset(14, 4)
                    .addBox(-1.0, -2.0, -4.0, 2, 2, 2);
                this.parts["head"].addChild(this.parts["bill"]);
                this.parts["head"].addChild(this.parts["wattle"]);

                // Body: 6x6x8 at (0, 9)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(0, 9)
                    .setRotationPoint(0.0, 16.0, 0.0)
                    .addBox(-3.0, -3.0, -4.0, 6, 6, 8);

                // 2 legs: 3x5x3 at (26, 0)
                this.parts["leg1"] = new ModelRenderer("leg1", W, H)
                    .setTextureOffset(26, 0)
                    .setRotationPoint(-1.5, 19.0, 1.0)
                    .addBox(-1.5, 0.0, -1.5, 3, 5, 3);
                this.parts["leg2"] = new ModelRenderer("leg2", W, H)
                    .setTextureOffset(26, 0)
                    .setRotationPoint(1.5, 19.0, 1.0)
                    .addBox(-1.5, 0.0, -1.5, 3, 5, 3);

                // 2 wings: 1x4x6 at (24, 13)
                this.parts["wing1"] = new ModelRenderer("wing1", W, H)
                    .setTextureOffset(24, 13)
                    .setRotationPoint(-4.0, 16.0, 0.0)
                    .addBox(0.0, -2.0, -3.0, 1, 4, 6);
                this.parts["wing2"] = new ModelRenderer("wing2", W, H)
                    .setTextureOffset(24, 13)
                    .setRotationPoint(3.0, 16.0, 0.0)
                    .addBox(0.0, -2.0, -3.0, 1, 4, 6);
                break;

            case "wolf":
                // Head: 6x6x6 at (0, 0)
                this.parts["head"] = new ModelRenderer("head", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 13.5, -5.0)
                    .addBox(-3.0, -3.0, -4.0, 6, 6, 6);
                // Snout
                this.parts["snout"] = new ModelRenderer("snout", W, H)
                    .setTextureOffset(16, 14)
                    .addBox(-1.5, 0.0, -6.0, 3, 3, 2);
                this.parts["head"].addChild(this.parts["snout"]);

                // Body: 6x6x8 at (18, 14)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(18, 14)
                    .setRotationPoint(0.0, 16.0, 0.0)
                    .addBox(-3.0, -3.0, -4.0, 6, 6, 8);

                // 4 legs: 2x8x2 at (0, 18)
                this.parts["leg1"] = new ModelRenderer("leg1", W, H)
                    .setTextureOffset(0, 18)
                    .setRotationPoint(-1.5, 16.0, -3.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 8, 2);
                this.parts["leg2"] = new ModelRenderer("leg2", W, H)
                    .setTextureOffset(0, 18)
                    .setRotationPoint(1.5, 16.0, -3.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 8, 2);
                this.parts["leg3"] = new ModelRenderer("leg3", W, H)
                    .setTextureOffset(0, 18)
                    .setRotationPoint(-1.5, 16.0, 3.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 8, 2);
                this.parts["leg4"] = new ModelRenderer("leg4", W, H)
                    .setTextureOffset(0, 18)
                    .setRotationPoint(1.5, 16.0, 3.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 8, 2);
                break;

            case "ocelot":
                // Head: 5x3x4 at (0, 0)
                this.parts["head"] = new ModelRenderer("head", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 15.0, -5.0)
                    .addBox(-2.5, -2.0, -3.0, 5, 4, 4);
                // Body: 4x12x6 at (20, 0)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(20, 0)
                    .setRotationPoint(0.0, 16.0, 0.0)
                    .addBox(-2.0, -3.0, -6.0, 4, 6, 12);
                // 4 legs: 2x10x2 at (0, 24)
                this.parts["leg1"] = new ModelRenderer("leg1", W, H)
                    .setTextureOffset(0, 24)
                    .setRotationPoint(-1.1, 16.0, -4.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 8, 2);
                this.parts["leg2"] = new ModelRenderer("leg2", W, H)
                    .setTextureOffset(0, 24)
                    .setRotationPoint(1.1, 16.0, -4.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 8, 2);
                this.parts["leg3"] = new ModelRenderer("leg3", W, H)
                    .setTextureOffset(0, 24)
                    .setRotationPoint(-1.1, 16.0, 4.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 8, 2);
                this.parts["leg4"] = new ModelRenderer("leg4", W, H)
                    .setTextureOffset(0, 24)
                    .setRotationPoint(1.1, 16.0, 4.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 8, 2);
                break;

            case "squid":
                // Body: 12x12x12 at (0, 0)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 8.0, 0.0)
                    .addBox(-6.0, -6.0, -6.0, 12, 12, 12);
                // 8 Tentacles: 2x8x2 at (48, 0)
                for (let i = 0; i < 8; i++) {
                    let angle = i * Math.PI / 4;
                    let tx = Math.cos(angle) * 4.0;
                    let tz = Math.sin(angle) * 4.0;
                    this.parts["tentacle" + i] = new ModelRenderer("tentacle" + i, W, H)
                        .setTextureOffset(48, 0)
                        .setRotationPoint(tx, 14.0, tz)
                        .addBox(-1.0, 0.0, -1.0, 2, 10, 2);
                }
                break;

            case "slime":
            case "lavaslime":
                // Outer Body: 8x8x8 at (0, 0)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 16.0, 0.0)
                    .addBox(-4.0, -4.0, -4.0, 8, 8, 8);
                break;

            case "villager":
                // Head: 8x10x8 at (0, 0)
                this.parts["head"] = new ModelRenderer("head", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, 6.0, 0.0)
                    .addBox(-4.0, -10.0, -4.0, 8, 10, 8);
                // Nose
                this.parts["nose"] = new ModelRenderer("nose", W, H)
                    .setTextureOffset(24, 0)
                    .addBox(-1.0, -3.0, -6.0, 2, 4, 2);
                this.parts["head"].addChild(this.parts["nose"]);

                // Body: 8x12x6 at (16, 20)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(16, 20)
                    .setRotationPoint(0.0, 6.0, 0.0)
                    .addBox(-4.0, 0.0, -3.0, 8, 12, 6);

                // Folded Arms: 10x8x4 at (40, 38)
                this.parts["arms"] = new ModelRenderer("arms", W, H)
                    .setTextureOffset(40, 38)
                    .setRotationPoint(0.0, 10.0, -2.0)
                    .addBox(-5.0, -4.0, -2.0, 10, 8, 4);

                // 2 legs: 4x12x4 at (0, 22)
                this.parts["leg1"] = new ModelRenderer("leg1", W, H)
                    .setTextureOffset(0, 22)
                    .setRotationPoint(-2.0, 12.0, 0.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                this.parts["leg2"] = new ModelRenderer("leg2", W, H)
                    .setTextureOffset(0, 22)
                    .setRotationPoint(2.0, 12.0, 0.0)
                    .addBox(-2.0, 0.0, -2.0, 4, 12, 4);
                break;

            case "enderman":
                // Thin and extremely tall model
                // Head: 8x8x8 at (0, 0)
                this.parts["head"] = new ModelRenderer("head", W, H)
                    .setTextureOffset(0, 0)
                    .setRotationPoint(0.0, -18.0, 0.0)
                    .addBox(-4.0, -8.0, -4.0, 8, 8, 8);
                // Body: 8x12x4 at (32, 16)
                this.parts["body"] = new ModelRenderer("body", W, H)
                    .setTextureOffset(32, 16)
                    .setRotationPoint(0.0, -18.0, 0.0)
                    .addBox(-4.0, 0.0, -2.0, 8, 12, 4);
                // Arms: 2x30x2 at (56, 0)
                this.parts["arm1"] = new ModelRenderer("arm1", W, H)
                    .setTextureOffset(56, 0)
                    .setRotationPoint(-5.0, -18.0, 0.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 30, 2);
                this.parts["arm2"] = new ModelRenderer("arm2", W, H)
                    .setTextureOffset(56, 0)
                    .setRotationPoint(5.0, -18.0, 0.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 30, 2);
                // Legs: 2x30x2 at (56, 0)
                this.parts["leg1"] = new ModelRenderer("leg1", W, H)
                    .setTextureOffset(56, 0)
                    .setRotationPoint(-2.0, -6.0, 0.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 30, 2);
                this.parts["leg2"] = new ModelRenderer("leg2", W, H)
                    .setTextureOffset(56, 0)
                    .setRotationPoint(2.0, -6.0, 0.0)
                    .addBox(-1.0, 0.0, -1.0, 2, 30, 2);
                break;
        }
    }

    rebuild(tessellator, group) {
        super.rebuild(tessellator, group);
        for (let key in this.parts) {
            this.parts[key].rebuild(tessellator, group);
        }
    }

    render(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks) {
        this.setRotationAngles(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks);
        for (let key in this.parts) {
            this.parts[key].render();
        }
        super.render(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks);
    }

    setRotationAngles(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks) {
        if (this.parts["head"]) {
            this.parts["head"].rotateAngleY = MathHelper.toRadians(yaw);
            this.parts["head"].rotateAngleX = MathHelper.toRadians(pitch);
        }

        // Idle micro-animations for head breathing
        if (this.parts["head"]) {
            this.parts["head"].rotateAngleX += Math.cos(timeAlive * 0.05) * 0.02;
        }

        // Simple passive movement of limbs
        let motionX = Math.cos(limbSwing * 0.6662) * 1.4 * limbSwingStrength;
        let motionY = Math.cos(limbSwing * 0.6662 + Math.PI) * 1.4 * limbSwingStrength;

        if (this.parts["leg1"]) this.parts["leg1"].rotateAngleX = motionX;
        if (this.parts["leg2"]) this.parts["leg2"].rotateAngleX = motionY;
        if (this.parts["leg3"]) this.parts["leg3"].rotateAngleX = motionY;
        if (this.parts["leg4"]) this.parts["leg4"].rotateAngleX = motionX;

        // Villager arms and tentacles idle
        if (this.mobType === "squid") {
            for (let i = 0; i < 8; i++) {
                if (this.parts["tentacle" + i]) {
                    this.parts["tentacle" + i].rotateAngleZ = Math.sin(timeAlive * 0.1 + i) * 0.1;
                }
            }
        }
    }
}

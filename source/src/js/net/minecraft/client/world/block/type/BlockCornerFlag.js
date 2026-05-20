import Block from "../Block.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockCornerFlag extends Block {
    constructor(id, textureSlotId) {
        super(id, textureSlotId);
        // Thin pole
        this.boundingBox = new BoundingBox(0.45, 0.0, 0.45, 0.55, 1.0, 0.55);
        this.sound = Block.sounds.cloth;
    }

    isTranslucent() {
        return true;
    }

    isSolid() {
        return false;
    }

    shouldRenderFace(world, x, y, z, face) {
        return true; // Always render faces because it's thin
    }

    getOpacity() {
        return 0;
    }
}

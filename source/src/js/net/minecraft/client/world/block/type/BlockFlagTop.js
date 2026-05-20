import Block from "../Block.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockFlagTop extends Block {
    constructor(id, textureSlotId) {
        super(id, textureSlotId);
        // Small thin box that extends like a flag
        this.boundingBox = new BoundingBox(0.45, 0.0, 0.45, 0.55, 0.6, 1.2);
        this.sound = Block.sounds.cloth;
    }

    isTranslucent() { return true; }
    isSolid() { return false; }
    shouldRenderFace() { return true; }
    getOpacity() { return 0; }
}

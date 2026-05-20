import Block from "../Block.js";

export default class BlockGoalPost extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);
        this.sound = Block.sounds.stone;
    }
}

import Block from "../Block.js";

export default class BlockTurf extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);
        this.sound = Block.sounds.grass;
    }
}

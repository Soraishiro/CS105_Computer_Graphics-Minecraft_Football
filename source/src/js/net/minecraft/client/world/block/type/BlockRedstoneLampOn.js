import Block from "../Block.js";

export default class BlockRedstoneLampOn extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);
    }

    getLightValue() {
        return 14;
    }

}
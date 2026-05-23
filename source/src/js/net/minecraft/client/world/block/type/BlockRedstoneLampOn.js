import Block from "../Block.js";

export default class BlockRedstoneLampOn extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);
    }

    getLightValue() {
        return 20;
    }

    isEmissive() {
        return true; // Khối sẽ tự sáng độc lập
    }

    getEmissiveMultiplier() {
        return 1; // Độ sáng siêu cấp của LampStone (Màu sẽ trắng hơn và rực rỡ hơn)
    }

}
import Particle from "../Particle.js";

export default class ParticleRainSplash extends Particle {

    constructor(minecraft, world, x, y, z) {
        // Mưa splash có motion ngẫu nhiên hướng lên nhẹ và sang 2 bên
        let motionX = (Math.random() * 2 - 1) * 0.05;
        let motionY = 0.05 + Math.random() * 0.1;
        let motionZ = (Math.random() * 2 - 1) * 0.05;
        super(minecraft, world, x, y, z, motionX, motionY, motionZ);

        // Màu nước xanh dương nhạt: #4c7c9c
        this.color = 0x4c7c9c;
        
        // Sử dụng hạt texture index 0 nhưng tô màu xanh nước
        this.textureIndex = 0;
        this.maxTicksExisted = 3 + Math.floor(Math.random() * 4);
        
        // Điều chỉnh kích thước nhỏ hơn bình thường
        this.randomZ = 0.35;
    }

}

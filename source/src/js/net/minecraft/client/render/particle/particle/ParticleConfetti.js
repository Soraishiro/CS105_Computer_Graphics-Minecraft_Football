import Particle from "../Particle.js";

export default class ParticleConfetti extends Particle {

    static COLORS = [
        0xff3b30,
        0xffcc00,
        0x34c759,
        0x0a84ff,
        0xaf52de,
        0xff9f0a
    ];

    constructor(minecraft, world, x, y, z) {
        let motionX = (Math.random() * 2 - 1) * 0.08;
        let motionY = 0.18 + Math.random() * 0.08;
        let motionZ = (Math.random() * 2 - 1) * 0.08;
        super(minecraft, world, x, y, z, motionX, motionY, motionZ);

        this.color = ParticleConfetti.COLORS[Math.floor(Math.random() * ParticleConfetti.COLORS.length)];
        this.textureIndex = 0;
        this.maxTicksExisted = 40 + Math.floor(Math.random() * 40);
        this.randomZ = 0.55 + Math.random() * 0.35;

        this.gravity = 0.02;
        this.airResistance = 0.96;
        this.groundFriction = 0.6;
    }

    onUpdate() {
        super.onUpdate();

        if (this.ticksExisted >= this.maxTicksExisted) {
            this.kill();
            return;
        }

        this.motionY -= this.gravity;
        this.moveCollide(this.motionX, this.motionY, this.motionZ);

        this.motionX *= this.airResistance;
        this.motionY *= this.airResistance;
        this.motionZ *= this.airResistance;

        if (this.onGround) {
            this.motionX *= this.groundFriction;
            this.motionZ *= this.groundFriction;
        }
    }
}

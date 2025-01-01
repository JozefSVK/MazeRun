class Player extends Phaser.GameObjects.Arc {
    constructor(scene, x, y) {
        super(scene, x, y, 15, 0, 360, false, 0xff0000);
        this.scene = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCollideWorldBounds(true);
    }

    setVelocity(x, y) {
        this.body.setVelocity(x, y);
    }

    resetPosition(x, y) {
        this.setPosition(x, y);
        this.setVelocity(0, 0);
    }
}

export default Player;
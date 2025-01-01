class Coin extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size) {
        super(scene, x, y);
        
        // Create coin circle and glow
        this.glow = scene.add.circle(0, 0, size * 1.5, 0xffff00, 0.2);
        this.coin = scene.add.circle(0, 0, size, 0xffff00);
        
        this.add([this.glow, this.coin]);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        // Animation properties
        this.startY = y;
        this.hoverDistance = 5;
        this.hoverSpeed = 1.5;
        
        // Start animations
        this.setupAnimations();
    }

    setupAnimations() {
        // Hover animation
        this.scene.tweens.add({
            targets: this,
            y: this.startY - this.hoverDistance,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rotation animation
        this.scene.tweens.add({
            targets: this.coin,
            scaleX: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Enhanced glow pulse
        this.scene.tweens.add({
            targets: this.glow,
            scale: 1.2,
            alpha: 0.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}

export default Coin;
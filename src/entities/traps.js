class SpikeBall extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size) {
        super(scene, x, y);
        
        // Create the main ball and spikes with red colors
        this.ball = scene.add.circle(0, 0, size, 0xff0000);
        
        // Create spikes around the ball
        this.spikes = [];
        const spikeCount = 8;
        const spikeLength = size * 0.5;
        
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const spike = scene.add.triangle(
                Math.cos(angle) * size,
                Math.sin(angle) * size,
                0, -spikeLength,
                spikeLength * 0.5, spikeLength,
                -spikeLength * 0.5, spikeLength,
                0xcc0000
            );
            spike.setRotation(angle + Math.PI / 2);
            this.spikes.push(spike);
        }

        // Add all game objects to the container
        this.add([this.ball, ...this.spikes]);
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        
        // Set up rotation animation
        this.setupAnimation();
    }

    setupAnimation() {
        this.scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1,
            ease: 'Linear'
        });
    }
}

class RotatingBlade extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        
        const {
            width = 200,          // Total width of the blade
            rotationSpeed = 2000  // Time for one rotation in ms
        } = config;

        // Calculate dimensions
        const halfWidth = width / 2;
        const circleRadius = width * 0.05;
        const maxHeight = width * 0.08;
        
        // Recenter the blade points around (0,0)
        const bladePoints = [
            { x: -halfWidth, y: 0 },                    // Left tip
            { x: -circleRadius, y: maxHeight/2 },       // Left inner
            { x: 0, y: maxHeight/2 },                   // Center top
            { x: circleRadius, y: maxHeight/2 },        // Right inner
            { x: halfWidth, y: 0 },                     // Right tip
            { x: circleRadius, y: -maxHeight/2 },       // Right inner bottom
            { x: 0, y: -maxHeight/2 },                  // Center bottom
            { x: -circleRadius, y: -maxHeight/2 }       // Left inner bottom
        ];

        // Create blade with more points for smoother shape
        const blade = scene.add.polygon(halfWidth, maxHeight/2, bladePoints, 0xff0000);
        
        // Center circle
        const centerCircle = scene.add.circle(0, 0, circleRadius, 0xff0000);
    
        this.add([blade, centerCircle]);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        
        this.setupRotationAnimation(rotationSpeed);
    }

    setupRotationAnimation(speed) {
        this.scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: speed,
            repeat: -1,
            ease: 'Linear'
        });
    }
}


export { SpikeBall, RotatingBlade  };
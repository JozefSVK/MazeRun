const CollisionCategories = {
    PLAYER: 0x0001,
    TRAP: 0x0002,
    COIN: 0x0004,
    OBSTACLE: 0x0008
};

class SpikeBall extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size) {
        super(scene, x, y);
        
        // Create visual elements
        this.ball = scene.add.circle(0, 0, size, 0xff0000);
        
        // Create spikes
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

        // Add visuals to container
        this.add([this.ball, ...this.spikes]);
        scene.add.existing(this);

        // Create Matter.js bodies
        const bodies = [];
        
        // Add center circle body
        const centerBody = scene.matter.add.circle(x, y, size, {
            label: 'spikeball_center',
            collisionFilter: {
                category: CollisionCategories.TRAP,
                mask: CollisionCategories.PLAYER
            }
        });
        bodies.push(centerBody);
        
        // Add spike bodies
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const spikeX = x + Math.cos(angle) * size;
            const spikeY = y + Math.sin(angle) * size;
            
            // Create a triangular body for each spike
            const spikeBody = scene.matter.add.polygon(spikeX, spikeY, 3, spikeLength, {
                angle: angle + Math.PI / 2,
                label: 'spikeball_spike',
                collisionFilter: {
                    category: CollisionCategories.TRAP,
                    mask: CollisionCategories.PLAYER
                }
            });
            bodies.push(spikeBody);
        }

        // Create compound body
        this.physicsBody = scene.matter.body.create({
            parts: bodies,
            isStatic: true,
            label: 'spikeball',
            collisionFilter: {
                category: CollisionCategories.TRAP,
                mask: CollisionCategories.PLAYER
            }
        });
        this.physicsBody.gameObject = this;

        // Setup update listener
        this.updateListener = this.update.bind(this);
        scene.events.on('update', this.updateListener);
        
        // Setup cleanup listener
        scene.events.once('shutdown', this.cleanup.bind(this));
        
        // Set up rotation animation
        this.setupAnimation();
    }

    update() {
        if (!this.scene || !this.physicsBody) return;
        // Update physics body rotation to match visual rotation
        this.scene.matter.body.setAngle(this.physicsBody, this.rotation);
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

    cleanup() {
        if (this.scene) {
            this.scene.events.off('update', this.updateListener);
        }
        if (this.physicsBody && this.scene?.matter?.world) {
            this.scene.matter.world.remove(this.physicsBody);
            this.physicsBody = null;
        }
    }

    destroy(fromScene) {
        this.cleanup();
        super.destroy(fromScene);
    }
}

export default SpikeBall;
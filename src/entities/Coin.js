const CollisionCategories = {
    PLAYER: 0x0001,
    TRAP: 0x0002,
    COIN: 0x0004,
    OBSTACLE: 0x0008
};

class Coin extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size) {
        super(scene, x, y);
        
        // Save scene reference
        this.scene = scene;
        this.isDestroyed = false;
        
        // Create visual elements
        this.glow = this.scene.add.circle(0, 0, size * 1.5, 0xffff00, 0.2);
        this.coin = this.scene.add.circle(0, 0, size, 0xffff00);
        
        // Add visuals to container
        this.add([this.glow, this.coin]);
        
        // Add container to scene
        this.scene.add.existing(this);
        
        // Create Matter.js physics body
        this.physicsBody = this.scene.matter.add.circle(x, y, size, {
            isSensor: true,     // Make it non-solid for collection
            isStatic: true,     // Make it immovable
            label: 'coin',       // Label for collision detection
            collisionFilter: {
                category: CollisionCategories.COIN,
                mask: CollisionCategories.PLAYER  // Only collide with player
            }
        });
        
        // Store reference to this game object in the physics body
        this.physicsBody.gameObject = this;
        
        // Animation properties
        this.startY = y;
        this.hoverDistance = 5;
        this.hoverSpeed = 1.5;
        
        // Store animation tweens for cleanup
        this.tweens = [];
        
        // Setup animations
        this.setupAnimations();
        
        // Setup update listener for syncing physics body
        this.updateListener = this.updatePhysics.bind(this);
        this.scene.events.on('update', this.updateListener);
        
        // Setup cleanup listener
        this.scene.events.once('shutdown', this.cleanup.bind(this));
    }
    
    setupAnimations() {
        // Hover animation
        this.tweens.push(
            this.scene.tweens.add({
                targets: this,
                y: this.startY - this.hoverDistance,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            })
        );
        
        // Rotation animation
        this.tweens.push(
            this.scene.tweens.add({
                targets: this.coin,
                scaleX: 0.5,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            })
        );
        
        // Glow pulse
        this.tweens.push(
            this.scene.tweens.add({
                targets: this.glow,
                scale: 1.2,
                alpha: 0.1,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            })
        );
    }
    
    updatePhysics() {
        // Check if coin is destroyed or scene is gone
        if (this.isDestroyed || !this.scene || !this.physicsBody) {
            return;
        }
        try {
            this.scene.matter.body.setPosition(this.physicsBody, {
                x: this.x,
                y: this.y
            });
        } catch(error) {
            console.warn('Error updating physics for coin:', error);
        }
    }
    
    cleanup() {
        if (this.isDestroyed) return;  // Prevent multiple cleanups
        
        // Stop and remove all tweens
        if (this.tweens) {
            this.tweens.forEach(tween => {
                if (tween && tween.stop) {
                    tween.stop();
                    tween.remove();
                }
            });
            this.tweens = [];
        }
        
        // Remove update listener
        if (this.scene) {
            this.scene.events.off('update', this.updateListener);
        }
        
        // Remove physics body
        if (this.physicsBody && this.scene?.matter?.world) {
            try {
                this.scene.matter.world.remove(this.physicsBody);
            } catch(error) {
                console.warn('Error removing physics body:', error);
            }
            this.physicsBody = null;
        }
        
        // Destroy visual elements
        if (this.glow) {
            this.glow.destroy();
            this.glow = null;
        }
        if (this.coin) {
            this.coin.destroy();
            this.coin = null;
        }
        
        this.isDestroyed = true;
    }
    
    destroy(fromScene) {
        this.cleanup();
        if (this.scene) {
            super.destroy(fromScene);
        }
        this.scene = null;
    }
}

export default Coin;
const CollisionCategories = {
    PLAYER: 0x0001,
    TRAP: 0x0002,
    COIN: 0x0004,
    OBSTACLE: 0x0008
};

class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size) {
        super(scene, x, y);
        
        this.size = size;
        this.isHit = false;
        this.scene = scene; // Ensure scene reference is stored
        
        // Create visual representation
        this.visual = scene.add.circle(0, 0, size, 0xff0000);
        this.add(this.visual);
        
        // Add to scene
        scene.add.existing(this);
        
        // Create physics body
        this.physicsBody = scene.matter.add.circle(x, y, size, {
            frictionAir: 0.002,
            restitution: 0.8,
            density: 0.001,
            label: 'player',
            collisionFilter: {
                category: CollisionCategories.PLAYER,
                mask: CollisionCategories.TRAP | CollisionCategories.COIN | CollisionCategories.OBSTACLE  // Use bitwise OR to combine categories
            }
        });
        
        // Store reference to this game object in the physics body
        this.physicsBody.gameObject = this;
        
        // Setup update listener for syncing visual with physics
        this.updateListener = this.updateVisual.bind(this);
        scene.events.on('update', this.updateListener);
        
        // Setup cleanup listener (defensive check for scene existence)
        scene.events.once('shutdown', () => {
            if (this.scene) {
                this.cleanup();
            }
        });
    }
    
    updateVisual() {
        if (this.visual && this.physicsBody) {
            this.x = this.physicsBody.position.x;
            this.y = this.physicsBody.position.y;
            this.rotation = this.physicsBody.angle;
        }
    }
    
    setPosition(x, y) {
        if (this.physicsBody && this.scene) {
            this.scene.matter.body.setPosition(this.physicsBody, { x, y });
        }
        super.setPosition(x, y);
    }
    
    handleTrapHit(respawnX, respawnY) {
        if (this.isHit) return;
        this.isHit = true;
        
        // Store current position for effects
        const currentX = this.x;
        const currentY = this.y;
        
        // Hide visual
        this.visual.setVisible(false);
        
        // Trigger smoke effect if available
        if (this.scene.smokeEmitter) {
            this.scene.smokeEmitter.setPosition(currentX, currentY);
            this.scene.smokeEmitter.explode();
        }
        
        // Add screen shake
        this.scene.cameras.main.shake(200, 0.01);
        
        // Respawn after delay
        this.scene.time.delayedCall(300, () => {
            // Reset position
            this.setPosition(respawnX, respawnY);
            this.setVelocity(0, 0);
            
            // Show visual with fade effect
            this.visual.setVisible(true);
            this.visual.setAlpha(0);
            
            this.scene.tweens.add({
                targets: this.visual,
                alpha: 1,
                duration: 200,
                ease: 'Linear',
                onComplete: () => {
                    this.isHit = false;
                }
            });
            
            // Spawn effect at respawn point
            if (this.scene.smokeEmitter) {
                this.scene.smokeEmitter.setPosition(respawnX, respawnY);
                this.scene.smokeEmitter.explode(10);
            }
        });
    }
    
    setVelocity(x, y) {
        if (this.physicsBody && this.scene) {
            this.scene.matter.body.setVelocity(this.physicsBody, { x, y });
        }
    }
    
    applyForce(force) {
        if (this.physicsBody && this.scene) {
            this.scene.matter.body.applyForce(this.physicsBody, 
                { x: this.physicsBody.position.x, y: this.physicsBody.position.y },
                force
            );
        }
    }
    
    cleanup() {
        if (!this.scene) return; // Defensive check
        
        // Remove update listener
        this.scene.events.off('update', this.updateListener);
        
        // Remove physics body
        if (this.physicsBody) {
            this.scene.matter.world.remove(this.physicsBody);
        }
        
        // Destroy container and its contents
        this.destroy();
    }
}

export default Player;

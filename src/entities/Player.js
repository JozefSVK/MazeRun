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
        this.scene = scene;
        
        // Create visual representation
        this.visual = scene.add.circle(0, 0, size, 0xff0000);
        this.add(this.visual);
        
        scene.add.existing(this);
        
        // Optimized physics properties for better movement
        this.physicsBody = scene.matter.add.circle(x, y, size, {
            frictionAir: 0.002,    // Low air friction for smooth movement
            restitution: 0.3,      // Slightly reduced bounce
            density: 0.001,       // Lower density for more responsive movement
            friction: 0.05,
            label: 'player',
            collisionFilter: {
                category: CollisionCategories.PLAYER,
                mask: CollisionCategories.TRAP | CollisionCategories.COIN | CollisionCategories.OBSTACLE
            }
        });
        
        this.physicsBody.gameObject = this;
        // Add velocity tracking
        this.lastVelocity = { x: 0, y: 0 };
        this.velocitySpike = false;

        // Setup collision handling
        scene.matter.world.on('collisionstart', this.handleCollision, this);
        
        // Add movement constants
        this.maxSpeed = 15;        // Increased maximum speed cap for quick movements
        
        this.updateListener = this.updateVisual.bind(this);
        scene.events.on('update', this.updateListener);
        
        scene.events.once('shutdown', () => {
            if (this.scene) {
                this.cleanup();
            }
        });
    }

    handleCollision(event) {
        const pairs = event.pairs;
        
        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA;
            const bodyB = pairs[i].bodyB;
            
            if (bodyA === this.physicsBody || bodyB === this.physicsBody) {
                // Get the other colliding body
                const otherBody = bodyA === this.physicsBody ? bodyB : bodyA;
                
                // Calculate the relative velocity
                const relativeVelocity = Math.sqrt(
                    Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
                    Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
                );
                
                // If the collision is high speed, dampen the player's velocity
                if (relativeVelocity > 5) {
                    this.scene.matter.body.setVelocity(this.physicsBody, {
                        x: this.physicsBody.velocity.x * 0.7,
                        y: this.physicsBody.velocity.y * 0.7
                    });
                }
            }
        }
    }
    
    updateVisual() {
        if (!this.visual || !this.physicsBody) return;
        
        // Check for sudden velocity changes
        const velocity = this.physicsBody.velocity;
        const velocityChange = Math.sqrt(
            Math.pow(velocity.x - this.lastVelocity.x, 2) +
            Math.pow(velocity.y - this.lastVelocity.y, 2)
        );
        
        // If there's a sudden velocity spike
        if (velocityChange > 8) {
            this.scene.matter.body.setVelocity(this.physicsBody, {
                x: velocity.x * 0.8,
                y: velocity.y * 0.8
            });
        }
        
        // Update position
        this.x = this.physicsBody.position.x;
        this.y = this.physicsBody.position.y;
        this.rotation = this.physicsBody.angle;
        
        // Store current velocity for next frame
        this.lastVelocity = { x: velocity.x, y: velocity.y };
    }
    
    setPosition(x, y) {
        if (this.physicsBody && this.scene) {
            this.scene.matter.body.setPosition(this.physicsBody, { x, y });
        }
        super.setPosition(x, y);
    }
    
    applyForce(force) {
        if (!this.physicsBody || !this.scene) return;
        
        // Get current velocity
        const velocity = this.physicsBody.velocity;
        const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // Only apply force if under max speed or trying to move in opposite direction
        if (currentSpeed < this.maxSpeed || 
            (velocity.x * force.x + velocity.y * force.y) < 0) {
            
            this.scene.matter.body.applyForce(this.physicsBody, 
                this.physicsBody.position,
                force
            );
        }
    }
    
    setVelocity(x, y) {
        if (this.physicsBody && this.scene) {
            this.scene.matter.body.setVelocity(this.physicsBody, { x, y });
        }
    }
    
    handleTrapHit(respawnX, respawnY) {
        if (this.isHit) return;
        this.isHit = true;
        
        const currentX = this.x;
        const currentY = this.y;
        
        this.visual.setVisible(false);
        
        if (this.scene.smokeEmitter) {
            this.scene.smokeEmitter.setPosition(currentX, currentY);
            this.scene.smokeEmitter.explode();
        }
        
        this.scene.cameras.main.shake(200, 0.01);
        
        this.scene.time.delayedCall(300, () => {
            this.setPosition(respawnX, respawnY);
            this.setVelocity(0, 0);
            
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
            
            if (this.scene.smokeEmitter) {
                this.scene.smokeEmitter.setPosition(respawnX, respawnY);
                this.scene.smokeEmitter.explode(10);
            }
        });
    }
    
    cleanup() {
        if (!this.scene) return;
        
        this.scene.events.off('update', this.updateListener);
        // Remove collision listener
        this.scene.matter.world.off('collisionstart', this.handleCollision, this);
        
        if (this.physicsBody) {
            this.scene.matter.world.remove(this.physicsBody);
        }
        
        this.destroy();
    }
}

export default Player;
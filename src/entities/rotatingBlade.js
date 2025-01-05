const CollisionCategories = {
    PLAYER: 0x0001,
    TRAP: 0x0002,
    COIN: 0x0004,
    OBSTACLE: 0x0008
};

class RotatingBlade extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        
        const {
            width = 200,
            rotationSpeed = 2000
        } = config;

        // Check if running on mobile and adjust speed
        const isMobile = scene.sys.game.device.os.android || 
                        scene.sys.game.device.os.iOS || 
                        scene.sys.game.device.os.windowsPhone;

        // Apply 50% speed reduction on mobile
        const adjustedSpeed = isMobile ? rotationSpeed * 2 : rotationSpeed;
        this.rotationSpeed = (Math.PI * 2) / (rotationSpeed / 1000 * 60);
        
        // Calculate dimensions
        const halfWidth = width / 2;
        const circleRadius = width * 0.05;
        const maxHeight = width * 0.08;
        const bladeWidth = width * 0.04;

        // Create blade shape
        const bladePoints = [
            { x: -halfWidth, y: 0 },
            { x: -circleRadius, y: maxHeight/2 },
            { x: 0, y: maxHeight/2 },
            { x: circleRadius, y: maxHeight/2 },
            { x: halfWidth, y: 0 },
            { x: circleRadius, y: -maxHeight/2 },
            { x: 0, y: -maxHeight/2 },
            { x: -circleRadius, y: -maxHeight/2 }
        ];

        // Create visual elements
        this.blade = scene.add.polygon(halfWidth, maxHeight/2, bladePoints, 0xff0000);
        this.centerCircle = scene.add.circle(0, 0, circleRadius, 0xff0000);
        
        this.add([this.blade, this.centerCircle]);
        scene.add.existing(this);

        // Create complex blade physics body using vertices
        const bladeBody = scene.matter.add.fromVertices(x, y, [bladePoints], {
            isStatic: true,
            label: 'blade_edge',
            friction: 0,           // No friction to prevent "catching"
            restitution: 0,       // No bounce
            density: 0.001,       // Low density
            collisionFilter: {
                category: CollisionCategories.TRAP,
                mask: CollisionCategories.PLAYER
            }
        });

        // Create center circle body
        const centerBody = scene.matter.add.circle(x, y, circleRadius, {
            isStatic: true,
            label: 'blade_center',
            friction: 0,           // No friction to prevent "catching"
            restitution: 0,       // No bounce
            density: 0.001,       // Low density
            collisionFilter: {
                category: CollisionCategories.TRAP,
                mask: CollisionCategories.PLAYER
            }
        });

        // Create compound body
        this.physicsBody = scene.matter.body.create({
            parts: [centerBody, bladeBody],
            isStatic: true,
            label: 'blade',
            collisionFilter: {
                category: CollisionCategories.TRAP,
                mask: CollisionCategories.PLAYER
            }
        });

        this.physicsBody.gameObject = this;
        this.currentRotation = 0;

        // Setup update listener
        this.updateListener = this.update.bind(this);
        scene.events.on('update', this.updateListener);
        
        // Setup cleanup listener
        scene.events.once('shutdown', this.cleanup.bind(this));
    }

    update() {
        if (!this.scene || !this.physicsBody) return;

        this.currentRotation += this.rotationSpeed;
        this.setRotation(this.currentRotation);
        this.scene.matter.body.setAngle(this.physicsBody, this.currentRotation);
        
        // Update position to match container
        this.scene.matter.body.setPosition(this.physicsBody, {
            x: this.x,
            y: this.y
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

export default RotatingBlade;
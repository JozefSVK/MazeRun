const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);
let ball;
let cursors;
let coins;
let obstacles;
let gyroEnabled = false;

function preload() {
    // No preload needed for shapes
}

let activeControl = localStorage.getItem('controlType') || 'keyboard';
let joystick = null;
let isDragging = false;
let dragStartPos = null;
let dragCurrentPos = null;
const joystickRadius = 50; // Maximum distance the joystick can move

function create() {
    // Create player ball
    ball = this.add.circle(400, 300, 15, 0xff0000);
    this.physics.add.existing(ball);
    ball.body.setCollideWorldBounds(true);

    // Initialize coins group
    coins = this.add.group();
    
    // Create coins manually
    for (let i = 0; i < 5; i++) {
        const coin = this.add.circle(100 + (i * 100), 100, 10, 0xffff00);
        this.physics.add.existing(coin);
        coins.add(coin);
    }

    // Initialize obstacles group
    obstacles = this.add.group();
    
    // Create obstacles manually
    const obstacle1 = this.add.rectangle(200, 200, 100, 20, 0x0000ff);
    const obstacle2 = this.add.rectangle(400, 400, 20, 100, 0x0000ff);
    const obstacle3 = this.add.rectangle(600, 300, 100, 20, 0x0000ff);
    
    // Add physics to obstacles
    this.physics.add.existing(obstacle1, true);
    this.physics.add.existing(obstacle2, true);
    this.physics.add.existing(obstacle3, true);
    
    // Add obstacles to group
    obstacles.add(obstacle1);
    obstacles.add(obstacle2);
    obstacles.add(obstacle3);

    // Setup controls
    cursors = this.input.keyboard.createCursorKeys();

    // Setup mobile controls
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
        gyroEnabled = true;
    }

    // Setup mouse control
    this.input.on('pointermove', handleMouseMove);

    // Collision handling
    this.physics.add.overlap(ball, coins, collectCoin, null, this);
    this.physics.add.collider(ball, obstacles, hitObstacle, null, this);

    // Setup input handlers based on active control
    setupControls.call(this);

    // Create joystick graphics (initially invisible)
    this.joystickGraphics = this.add.graphics();
    this.joystickGraphics.setScrollFactor(0); // Keep it fixed on screen
    this.joystickGraphics.setDepth(1000); // Make sure it's on top
}

function setupControls() {
    // Remove all existing control listeners
    if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
    }
    this.input.off('pointermove');
    this.input.off('pointerdown');
    this.input.off('pointerup');
    gyroEnabled = false;

    // Setup new control scheme
    switch (activeControl) {
        case 'mouse':
            setupVirtualJoystick.call(this);
            break;
        case 'gyroscope':
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', handleOrientation);
                gyroEnabled = true;
            }
            break;
        case 'keyboard':
            // Keyboard controls are handled in update()
            break;
    }
}

function setupVirtualJoystick() {
    this.input.on('pointerdown', (pointer) => {
        if (activeControl === 'mouse') {
            isDragging = true;
            dragStartPos = { x: pointer.x, y: pointer.y };
            dragCurrentPos = { x: pointer.x, y: pointer.y };
        }
    });

    this.input.on('pointermove', (pointer) => {
        if (activeControl === 'mouse' && isDragging) {
            // Calculate distance from joystick center
            const dx = pointer.x - dragStartPos.x;
            const dy = pointer.y - dragStartPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= joystickRadius) {
                // If within radius, use exact position
                dragCurrentPos = { x: pointer.x, y: pointer.y };
            } else {
                // If beyond radius, constrain to circle edge
                const angle = Math.atan2(dy, dx);
                dragCurrentPos = {
                    x: dragStartPos.x + Math.cos(angle) * joystickRadius,
                    y: dragStartPos.y + Math.sin(angle) * joystickRadius
                };
            }
        }
    });

    this.input.on('pointerup', () => {
        if (activeControl === 'mouse') {
            isDragging = false;
            dragStartPos = null;
            dragCurrentPos = null;
            ball.body.setVelocity(0);
        }
    });
}


function update() {
    // Clear any existing velocity
    ball.body.setVelocity(0);
    this.joystickGraphics.clear();

    if (activeControl === 'keyboard') {
        // Keyboard controls
        if (cursors.left.isDown) {
            ball.body.setVelocityX(-160);
        } else if (cursors.right.isDown) {
            ball.body.setVelocityX(160);
        } else {
            ball.body.setVelocityX(0);
        }

        if (cursors.up.isDown) {
            ball.body.setVelocityY(-160);
        } else if (cursors.down.isDown) {
            ball.body.setVelocityY(160);
        } else {
            ball.body.setVelocityY(0);
        }
    } else if (activeControl === 'mouse' && isDragging) {
        // Calculate joystick movement
        const dx = dragCurrentPos.x - dragStartPos.x;
        const dy = dragCurrentPos.y - dragStartPos.y;
        
        // Calculate distance from center
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize the movement
        const normalizedX = dx / Math.max(distance, joystickRadius);
        const normalizedY = dy / Math.max(distance, joystickRadius);
        
        // Apply velocity based on joystick position
        ball.body.setVelocityX(normalizedX * 160);
        ball.body.setVelocityY(normalizedY * 160);

        // Draw outer circle
        this.joystickGraphics.lineStyle(2, 0xffffff);
        this.joystickGraphics.strokeCircle(dragStartPos.x, dragStartPos.y, joystickRadius);
        
        // Draw joystick handle
        this.joystickGraphics.fillStyle(0x4444ff, 0.8);
        this.joystickGraphics.fillCircle(dragCurrentPos.x, dragCurrentPos.y, 20);
    }
    // Mouse/touch movement is handled by event listener
    // Gyroscope movement is handled by event listener
}

function handleOrientation(event) {
    if (gyroEnabled) {
        const x = event.gamma;
        const y = event.beta;
        ball.body.setVelocityX(x * 20);
        ball.body.setVelocityY(y * 20);
    }
}

function handleMouseMove(pointer) {
    const deltaX = pointer.x - ball.x;
    const deltaY = pointer.y - ball.y;
    ball.body.setVelocityX(deltaX * 0.2);
    ball.body.setVelocityY(deltaY * 0.2);
}

function collectCoin(ball, coin) {
    coin.destroy();
    // Add score logic here
}

function hitObstacle(ball, obstacle) {
    // Add game over logic here
}

// Listen for control changes
window.addEventListener('controlTypeChanged', (event) => {
    activeControl = event.detail.controlType;
    setupControls.call(this);
});

// Menu setup
if (document.getElementById('game-menu') && window.GameMenu) {
    ReactDOM.createRoot(document.getElementById('game-menu')).render(React.createElement(GameMenu));
}
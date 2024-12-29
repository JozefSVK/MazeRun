const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
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
    // Load the levels data
    this.load.json('levels', 'data/levels.json');
}

let activeControl = localStorage.getItem('controlType') || 'keyboard';
let isDragging = false;
let dragStartPos = null;
let dragCurrentPos = null;
let joystickRadius = Math.min(window.innerWidth, window.innerHeight) * 0.05; // 10% of smaller dimension

let gameWidth;
let gameHeight;

function repositionGameObjects() {
    if (!ball) return;

    // Keep ball's relative position when resizing
    const relativeX = ball.x / gameWidth;
    const relativeY = ball.y / gameHeight;
    ball.x = gameWidth * relativeX;
    ball.y = gameHeight * relativeY;

    // Adjust joystick radius based on screen size
    joystickRadius = Math.min(gameWidth, gameHeight) * 0.1; // 10% of smaller dimension

    // If you have a fixed joystick position, update it
    if (activeControl === 'mouse' && dragStartPos) {
        // Example: keep joystick in bottom-left corner
        dragStartPos.x = gameWidth * 0.2;
        dragStartPos.y = gameHeight * 0.8;
    }

    // Reposition other game objects similarly
    coins.getChildren().forEach((coin, index, total) => {
        const relX = coin.x / gameWidth;
        const relY = coin.y / gameHeight;
        coin.x = gameWidth * relX;
        coin.y = gameHeight * relY;
    });

    obstacles.getChildren().forEach((obstacle) => {
        const relX = obstacle.x / gameWidth;
        const relY = obstacle.y / gameHeight;
        // Also scale obstacle size
        const relWidth = obstacle.width / gameWidth;
        const relHeight = obstacle.height / gameHeight;
        
        obstacle.x = gameWidth * relX;
        obstacle.y = gameHeight * relY;
        obstacle.width = gameWidth * relWidth;
        obstacle.height = gameHeight * relHeight;
    });
}

function create() {
    // Get initial game dimensions
    gameWidth = this.scale.width;
    gameHeight = this.scale.height;

    // Add resize listener
    this.scale.on('resize', (gameSize) => {
        gameWidth = gameSize.width;
        gameHeight = gameSize.height;
        
        // Adjust game objects positions
        repositionGameObjects.call(this);
    });

    // Get the levels data
    levelsData = this.cache.json.get('levels');
    
    // Load the first level
    loadLevel.call(this, currentLevel);

    // Setup input handlers based on active control
    setupControls.call(this);

    // Create joystick graphics (initially invisible)
    this.joystickGraphics = this.add.graphics();
    this.joystickGraphics.setScrollFactor(0); // Keep it fixed on screen
    this.joystickGraphics.setDepth(1000); // Make sure it's on top
}

let currentLevel = 1;
let levelsData;

function loadLevel(levelNumber) {
    // Clear existing objects
    if (coins) coins.clear(true, true);
    if (obstacles) obstacles.clear(true, true);
    if (ball) ball.destroy();

    // Find the level data
    const level = levelsData.levels.find(l => l.id === levelNumber);
    if (!level) {
        console.error('Level not found:', levelNumber);
        return;
    }

    // Create player ball with relative position
    const relX = level.player.x / 800; // Assuming original width was 800
    const relY = level.player.y / 600; // Assuming original height was 600
    ball = this.add.circle(
        gameWidth * relX,
        gameHeight * relY,
        Math.min(gameWidth, gameHeight) * 0.025, // Relative size
        0xff0000
    );
    this.physics.add.existing(ball);
    ball.body.setCollideWorldBounds(true);

    // Create coins with relative positions
    coins = this.add.group();
    level.coins.forEach(coinData => {
        const relX = coinData.x / 800;
        const relY = coinData.y / 600;
        const coin = this.add.circle(
            gameWidth * relX,
            gameHeight * relY,
            Math.min(gameWidth, gameHeight) * 0.015,
            0xffff00
        );
        this.physics.add.existing(coin);
        coins.add(coin);
    });

    // Create obstacles with relative positions and sizes
    obstacles = this.add.group();
    level.obstacles.forEach(obstacleData => {
        const relX = obstacleData.x / 800;
        const relY = obstacleData.y / 600;
        const relWidth = obstacleData.width / 800;
        const relHeight = obstacleData.height / 600;
        
        const obstacle = this.add.rectangle(
            gameWidth * relX,
            gameHeight * relY,
            gameWidth * relWidth,
            gameHeight * relHeight,
            0x0000ff
        );
        this.physics.add.existing(obstacle, true);
        obstacles.add(obstacle);
    });

    // Setup collisions
    this.physics.add.overlap(ball, coins, collectCoin, null, this);
    this.physics.add.collider(ball, obstacles, hitObstacle, null, this);
}

function setupControls() {
    const scene = game.scene.scenes[0];
    // First clean up all controls
    cleanupControls(scene);
    
    // Then setup new control scheme
    switch (activeControl) {
        case 'mouse':
            setupVirtualJoystick(scene);
            break;
        case 'gyroscope':
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', handleOrientation);
                gyroEnabled = true;
            }
            break;
        case 'keyboard':
            cursors = scene.input.keyboard.createCursorKeys();
            break;
    }
}

function cleanupControls(scene) {
    if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
    }
    if (cursors) {
        cursors.up.reset();
        cursors.down.reset();
        cursors.left.reset();
        cursors.right.reset();
        cursors = null;
    }
    if(scene.input){
        scene.input.off('pointermove');
        scene.input.off('pointerdown');
        scene.input.off('pointerup');
    }
    gyroEnabled = false;
}

function setupVirtualJoystick(scene) {
    scene.input.on('pointerdown', (pointer) => {
        if (activeControl === 'mouse') {
            isDragging = true;
            dragStartPos = { x: pointer.x, y: pointer.y };
            dragCurrentPos = { x: pointer.x, y: pointer.y };
        }
    });

    scene.input.on('pointermove', (pointer) => {
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

    scene.input.on('pointerup', () => {
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
    if (!ball || !gyroEnabled) return;

    const x = event.gamma;
    const y = event.beta;
    if (x != null && y != null) {
        ball.body.setVelocityX(x * 20);
        ball.body.setVelocityY(y * 20);
    }
}

function collectCoin(ball, coin) {
    if (!coin || !coin.active) return;
    coin.destroy();
    
    // Check if level is complete
    if (coins.countActive() === 0) {
        // Move to next level
        currentLevel++;
        
        // Check if there are more levels
        if (currentLevel <= levelsData.levels.length) {
            loadLevel.call(this, currentLevel);
        } else {
            console.log('Game Complete!');
            currentLevel = 1; // Reset to first level
            loadLevel.call(this, currentLevel);
        }
    }
}

function hitObstacle(ball, obstacle) {
    // Reset ball position to level start
    const level = levelsData.levels.find(l => l.id === currentLevel);
    if (level) {
        ball.setPosition(level.player.x, level.player.y);
        ball.body.setVelocity(0, 0);
    }
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

window.gameControls = {
    pauseGame: function() {
        if (game?.scene) {
            game.scene.pause('default');
        }
    },
    resumeGame: function() {
        if (game?.scene) {
            game.scene.resume('default');
        }
    },
    quitGame: function() {
        if (game?.scene) {
            game.scene.start('default');
        }
    }
};
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
    // Nie je potrebné načítavať assety, použijeme základné tvary
}

function create() {
    // Create player ball
    ball = this.add.circle(400, 300, 15, 0xff0000);
    this.physics.add.existing(ball);
    ball.body.setCollideWorldBounds(true);

    // Create coins group
    coins = this.physics.add.group();
    
    // Create obstacles group
    obstacles = this.physics.add.group();

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
}

function update() {
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
}

function handleOrientation(event) {
    if (gyroEnabled) {
        const x = event.gamma; // -90 to 90
        const y = event.beta;  // -180 to 180

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
class LevelLoader {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 1;
        this.levelsData = null;

        // Store reference to scene dimensions
        this.gameWidth = scene.gameWidth;
        this.gameHeight = scene.gameHeight;

        // Base dimensions for relative calculations
        this.BASE_WIDTH = 800;
        this.BASE_HEIGHT = 600;
    }

    loadLevelsData() {
        this.levelsData = this.scene.cache.json.get('levels');
        if (!this.levelsData) {
            throw new Error('Levels data not found');
        }
    }

    loadLevel(levelNumber) {
        // Clear existing objects
        this.clearLevel();

        // Find the level data
        const level = this.levelsData.levels.find(l => l.id === levelNumber);
        if (!level) {
            console.error('Level not found:', levelNumber);
            return;
        }

        // Reset coins count in GameScene
        this.scene.coinsCollected = 0;
        this.scene.totalCoins = level.coins.length;
        this.scene.updateScore();  // Update the display

        this.createPlayer(level.player);
        this.createCoins(level.coins);
        this.createObstacles(level.obstacles);
        this.setupCollisions();
    }

    clearLevel(){
        if (this.scene.coins) this.scene.coins.clear(true, true);
        if (this.scene.obstacles) this.scene.obstacles.clear(true, true);
        if (this.scene.ball) this.scene.ball.destroy();
    }

    createPlayer(playerData) {
        const relX = playerData.x / this.BASE_WIDTH;
        const relY = playerData.y / this.BASE_HEIGHT;
        const size = Math.min(this.gameWidth, this.gameHeight) * 0.025;

        this.scene.ball = this.scene.add.circle(
            this.gameWidth * relX,
            this.gameHeight * relY,
            size,
            0xff0000
        );
        this.scene.physics.add.existing(this.scene.ball);
        this.scene.ball.body.setCollideWorldBounds(true);
    }

    createCoins(coinsData) {
        this.scene.coins = this.scene.add.group();

        coinsData.forEach(coinData => {
            const relX = coinData.x / this.BASE_WIDTH;
            const relY = coinData.y / this.BASE_HEIGHT;
            const size = Math.min(this.gameWidth, this.gameHeight) * 0.015;

            const coin = this.scene.add.circle(
                this.gameWidth * relX,
                this.gameHeight * relY,
                size,
                0xffff00
            );
            this.scene.physics.add.existing(coin);
            this.scene.coins.add(coin);
        });
    }

    createObstacles(obstaclesData) {
        this.scene.obstacles = this.scene.add.group();

        obstaclesData.forEach(obstacleData => {
            const relX = obstacleData.x / this.BASE_WIDTH;
            const relY = obstacleData.y / this.BASE_HEIGHT;
            const relWidth = obstacleData.width / this.BASE_WIDTH;
            const relHeight = obstacleData.height / this.BASE_HEIGHT;

            const obstacle = this.scene.add.rectangle(
                this.gameWidth * relX,
                this.gameHeight * relY,
                this.gameWidth * relWidth,
                this.gameHeight * relHeight,
                0x0000ff
            );
            this.scene.physics.add.existing(obstacle, true);
            this.scene.obstacles.add(obstacle);
        });
    }

    setupCollisions() {
        this.scene.physics.add.overlap(
            this.scene.ball, 
            this.scene.coins, 
            this.scene.collectCoin, 
            null, 
            this.scene
        );
        this.scene.physics.add.collider(
            this.scene.ball, 
            this.scene.obstacles, 
            this.scene.hitObstacle, 
            null, 
            this.scene
        );
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel <= this.levelsData.levels.length) {
            this.loadLevel(this.currentLevel);
        } else {
            this.scene.scene.start('EndScene');
        }
    }

    // Helper method to update dimensions when screen is resized
    updateDimensions(width, height) {
        this.gameWidth = width;
        this.gameHeight = height;
        // this.repositionGameObjects();
    }

    repositionGameObjects(){
        if (!this.scene.ball) return;

        // Reposition player
        const relativeX = this.scene.ball.x / this.BASE_WIDTH;
        const relativeY = this.scene.ball.y / this.BASE_HEIGHT;
        const ballSize = Math.min(this.scene.gameWidth, this.scene.gameHeight) * 0.025;
        
        this.scene.ball.x = this.scene.gameWidth * relativeX;
        this.scene.ball.y = this.scene.gameHeight * relativeY;
        this.scene.ball.setRadius(ballSize);

        // Reposition coins
        this.scene.coins.getChildren().forEach(coin => {
            const relX = coin.x / this.BASE_WIDTH;
            const relY = coin.y / this.BASE_HEIGHT;
            const coinSize = Math.min(this.scene.gameWidth, this.scene.gameHeight) * 0.015;
            
            coin.x = this.scene.gameWidth * relX;
            coin.y = this.scene.gameHeight * relY;
            coin.setRadius(coinSize);
        });

        // Reposition obstacles
        this.scene.obstacles.getChildren().forEach(obstacle => {
            const relX = obstacle.x / this.BASE_WIDTH;
            const relY = obstacle.y / this.BASE_HEIGHT;
            const relWidth = obstacle.width / this.BASE_WIDTH;
            const relHeight = obstacle.height / this.BASE_HEIGHT;
            
            obstacle.x = this.scene.gameWidth * relX;
            obstacle.y = this.scene.gameHeight * relY;
            obstacle.width = this.scene.gameWidth * relWidth;
            obstacle.height = this.scene.gameHeight * relHeight;
            
            // Update physics body size
            if (obstacle.body) {
                obstacle.body.setSize(obstacle.width, obstacle.height);
            }
        });
    }
}

export default LevelLoader;
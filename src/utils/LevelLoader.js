import Coin from "../entities/Coin.js"
import Player from "../entities/Player.js";
import Storage from '../utils/Storage.js';
import { SpikeBall, RotatingBlade, CollisionCategories } from "../entities/traps.js"; 

class LevelLoader {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = Storage.getCurrentLevel();
        this.levelsData = null;

        // Store reference to scene dimensions
        this.gameWidth = scene.gameWidth;
        this.gameHeight = scene.gameHeight;

        // Base dimensions for relative calculations
        this.BASE_WIDTH = 1280;
        this.BASE_HEIGHT = 720;
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

        Storage.saveCurrentLevel(levelNumber);
        this.currentLevel = levelNumber;

        // Find the level data
        const level = this.levelsData.levels.find(l => l.id === levelNumber);
        if (!level) {
            console.error('Level not found:', levelNumber);
            return;
        }
        console.log('Found level data:', !!level);

        // Reset coins count in GameScene
        this.scene.coinsCollected = 0;
        this.scene.totalCoins = level.coins.length;
        this.scene.updateScore();  // Update the display

        this.createPlayer(level.player);
        this.createWorldBounds();
        this.createCoins(level.coins);
        this.createObstacles(level.obstacles);
        this.createTraps(level.traps)
        this.setupCollisions();
    }

    clearLevel(){
        console.log('Clearing level...', {
            coinsExists: !!this.scene.coins,
            // coinsLength: this.scene.coins && this.scene.coins.getChildren?.()?.length
        });
        
        // Safely clear and destroy coins
        if (this.scene.coins) {
            if (typeof this.scene.coins.destroy === 'function') {
                this.scene.coins.destroy(true);
            }
            this.scene.coins = null;
        }

        // Clear and destroy obstacles
        if (this.scene.obstacles instanceof Phaser.GameObjects.Group) {
            if (typeof this.scene.obstacles.destroy === 'function') {
                this.scene.obstacles.destroy(true);
            }
            this.scene.obstacles = null;
        }

        if (this.scene.traps) {
            this.scene.traps.destroy(true);
            this.scene.traps = null;
        }

        // Destroy ball
        if (this.scene.ball?.destroy) {
            this.scene.ball.destroy();
            this.scene.ball = null;
        }

        if (this.scene.player) {
            this.scene.player.cleanup();
            this.scene.player = null;
        }
    }

    nextLevel() {
        console.log('Current level:', this.currentLevel);
        console.log('Total levels:', this.levelsData.levels.length);

        // Mark the current level as completed since player collected all coins
        Storage.addPlayedLevel(this.currentLevel);
        
        // Check if all levels have been played
        if (Storage.areAllLevelsPlayed(this.levelsData.levels)) {
            console.log('All levels completed, clearing played levels');
            Storage.clearProgress(); // Clear both played levels and current level
            this.scene.scene.start('EndScene');
            return;
        }
        
        
        // Get a random unplayed level
        const nextLevelId = Storage.getRandomUnplayedLevel(this.levelsData.levels);
        if (nextLevelId) {
            this.currentLevel = nextLevelId;
            Storage.saveCurrentLevel(nextLevelId); // Save the next level
            console.log('Loading next unplayed level:', this.currentLevel);
            this.scene.scene.start('TransitionScene', { nextLevel: this.currentLevel });
        } else {
            console.error('No levels available to play');
            this.scene.scene.start('EndScene');
        }
    }

    createPlayer(playerData) {
        const relX = playerData.x / this.BASE_WIDTH;
        const relY = playerData.y / this.BASE_HEIGHT;
        const size = Math.min(this.gameWidth, this.gameHeight) * 0.025;

        this.scene.player = new Player(
            this.scene,
            this.gameWidth * relX,
            this.gameHeight * relY,
            size
        );
    }

    createWorldBounds() {
        const wallThickness = 100;
        const wallOptions = {
            isStatic: true,
            label: 'boundary',
            collisionFilter: {
                category: CollisionCategories.OBSTACLE,
                mask: CollisionCategories.PLAYER
            }
        };
    
        // Top wall
        this.scene.matter.add.rectangle(
            this.gameWidth / 2, -wallThickness / 2,
            this.gameWidth + wallThickness * 2, wallThickness,
            wallOptions
        );
    
        // Bottom wall
        this.scene.matter.add.rectangle(
            this.gameWidth / 2, this.gameHeight + wallThickness / 2,
            this.gameWidth + wallThickness * 2, wallThickness,
            wallOptions
        );
    
        // Left wall
        this.scene.matter.add.rectangle(
            -wallThickness / 2, this.gameHeight / 2,
            wallThickness, this.gameHeight + wallThickness * 2,
            wallOptions
        );
    
        // Right wall
        this.scene.matter.add.rectangle(
            this.gameWidth + wallThickness / 2, this.gameHeight / 2,
            wallThickness, this.gameHeight + wallThickness * 2,
            wallOptions
        );
    }

    createCoins(coinsData) {
        if(!coinsData?.length){
            console.warn('No coins to create for this level');
            this.nextLevel();
            return;
        }
        // this.scene.coins = this.scene.add.group();

        // coinsData.forEach(coinData => {
        //     const relX = coinData.x / this.BASE_WIDTH;
        //     const relY = coinData.y / this.BASE_HEIGHT;
        //     const size = Math.min(this.gameWidth, this.gameHeight) * 0.015;

        //     // const coin = new Coin(
        //     //     this.gameWidth * relX,
        //     //     this.gameHeight * relY,
        //     //     size,
        //     //     0xffff00
        //     // );
        //     // this.scene.physics.add.existing(coin, true);
            
        //     const coin = new Coin(
        //         this.scene,
        //         this.gameWidth * relX,
        //         this.gameHeight * relY,
        //         size
        //     );
        //     this.scene.coins.add(coin);
        // });

        // Create a group that can handle containers
        this.scene.coins = this.scene.add.group({
            classType: Coin,
            runChildUpdate: true
        });

        coinsData.forEach(coinData => {
            const relX = coinData.x / this.BASE_WIDTH;
            const relY = coinData.y / this.BASE_HEIGHT;
            const size = Math.min(this.gameWidth, this.gameHeight) * 0.015;
            
            const coin = new Coin(
                this.scene,
                this.gameWidth * relX,
                this.gameHeight * relY,
                size
            );
            this.scene.coins.add(coin);
        });
    }

    createObstacles(obstaclesData) {
        if(!obstaclesData?.length) return;
        this.scene.obstacles = this.scene.add.group();

        obstaclesData.forEach(obstacleData => {
            const relX = obstacleData.x / this.BASE_WIDTH;
            const relY = obstacleData.y / this.BASE_HEIGHT;
            const relWidth = obstacleData.width / this.BASE_WIDTH;
            const relHeight = obstacleData.height / this.BASE_HEIGHT;

            // Create the rectangle visual
            const obstacle = this.scene.add.rectangle(
                this.gameWidth * relX,
                this.gameHeight * relY,
                this.gameWidth * relWidth,
                this.gameHeight * relHeight,
                0x0000ff
            );

            // Add Matter.js physics body
            const physicsBody = this.scene.matter.add.rectangle(
                this.gameWidth * relX,
                this.gameHeight * relY,
                this.gameWidth * relWidth,
                this.gameHeight * relHeight,
                {
                    isStatic: true,  // Make the obstacle immovable
                    label: 'obstacle',  // Label for collision detection
                    collisionFilter: {
                        category: CollisionCategories.OBSTACLE,
                        mask: CollisionCategories.PLAYER
                    }
                }
            );

            // Store reference to the physics body
            obstacle.physicsBody = physicsBody;
            physicsBody.gameObject = obstacle;

            this.scene.obstacles.add(obstacle);
        });
    }

    createTraps(trapsData) {
        if (!trapsData?.length) return;
    
        this.scene.traps = this.scene.add.group();
        
        trapsData.forEach(trapData => {
            const relX = trapData.x / this.BASE_WIDTH;
            const relY = trapData.y / this.BASE_HEIGHT;
            let trap;
            
            if (trapData.type === 'spikeball') {
                const size = Math.min(this.gameWidth, this.gameHeight) * 0.025;
                trap = new SpikeBall(
                    this.scene,
                    this.gameWidth * relX,
                    this.gameHeight * relY,
                    size
                );
            } else if (trapData.type === 'rotatingblade') {
                // Convert width to relative size
                const baseWidth = trapData.width || 200;
                const relativeWidth = (baseWidth / this.BASE_WIDTH) * this.gameWidth;
                
                trap = new RotatingBlade(
                    this.scene,
                    this.gameWidth * relX,
                    this.gameHeight * relY,
                    {
                        width: relativeWidth,
                        rotationSpeed: trapData.rotationSpeed || 2000,
                        bladeWidth: Math.min(this.gameWidth, this.gameHeight) * 0.015
                    }
                );
            }
            
            if (trap) {
                this.scene.traps.add(trap);
            }
        });
    }

    setupCollisions() {
        this.scene.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
    
                // Check if either body is a coin
                const coinBody = bodyA.label === 'coin' ? bodyA : 
                               bodyB.label === 'coin' ? bodyB : null;
                const playerBody = bodyA.label === 'player' ? bodyA : 
                                 bodyB.label === 'player' ? bodyB : null;
    
                if (coinBody && playerBody) {
                    const coin = coinBody.gameObject;
                    if (coin && !coin.isDestroyed) {
                        this.scene.collectCoin(this.scene.player, coin);
                    }
                }
    
                // Check for trap collision
                const isTrapA = bodyA.label.includes('blade') || bodyA.label.includes('spikeball');
                const isTrapB = bodyB.label.includes('blade') || bodyB.label.includes('spikeball');
    
                if ((isTrapA || isTrapB) && playerBody) {
                    // Get the trap gameObject from its parent body
                    const trapBody = isTrapA ? bodyA : bodyB;
                    const trap = trapBody.parent.gameObject;
                    
                    if (trap) {
                        this.scene.hitTrap(this.scene.player, trap);
                    }
                }
            });
        });
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
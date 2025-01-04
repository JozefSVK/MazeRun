import InputController from "../controllers/InputController.js";
import LevelLoader from "../utils/LevelLoader.js";
import GameMenu from '../components/GameMenu.js'; 
import Coin from '../entities/Coin.js';

console.log('GameScene.js loaded');
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // Scene-specific variables
        this.ball = null;
        this.coins = null;
        this.traps = null;
        this.obstacles = null;
        this.gameWidth = null;
        this.gameHeight = null;

        this.levelLoader = null;
        
        this.inputController = null;

        this.scoreText = null;
        this.coinsCollected = 0;
        this.totalCoins = 0;

        this.gameState = {
            isPaused: false,
            score: 0,
            currentLevel: 1
        }

        // Add particle manager
        this.smokeEmitter = null;
    }

    preload() {
        this.load.json('levels', 'data/levels.json');
    }

    create() {
        // Get initial game dimensions
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;

        this.createScoreDisplay();
        this.setupGameObjects();
        this.createSmokeEffect();
        this.setupEventListeners();
        this.setupGameMenu();

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xFFFFFF); // 2px white line
        graphics.strokeRect(0, 0, this.gameWidth, this.gameHeight);
    }

    setupGameObjects(){
        try{
            // Initialize level loader first
            this.levelLoader = new LevelLoader(this);
            this.levelLoader.loadLevelsData();
            
            // Get the level from scene data, or default to 1
            const level = this.scene.settings.data?.level || 1;
            this.levelLoader.loadLevel(level);
    
            // Initialize input controller after player exists
            this.inputController = new InputController(this);
            this.inputController.setupControls();
        } catch(error){
            console.error("failed to setup game objects:", error);
        }
    }

    setupEventListeners(){
        this.scale.on('resize', this.handleResize, this);
        this.events.on('shutdown', this.cleanup, this);
    }

    setupGameMenu() {
        // this.gameMenu = new GameMenu(this);
        const menuRoot = document.getElementById('game-menu');
        if (!menuRoot) return;
        
        this.menuRoot = ReactDOM.createRoot(menuRoot);
        this.menuRoot.render(React.createElement(GameMenu));
        
        window.gameControls = {
            pauseGame: () => this.scene.pause(),
            resumeGame: () => this.scene.resume(),
            quitGame: () => {
                try {
                    if (this.menuRoot) {
                        this.menuRoot.unmount();
                        this.menuRoot = null;
                    }
                    this.cleanup();
                    this.scene.start('MenuScene');
                } catch (error) {
                    console.error('Error during quitGame:', error);
                }
            }
        };
    }

    createScoreDisplay() {
        // Style for the score text
        const textStyle = {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        };
    
        this.scoreText = this.add.text(
            20,  // x position
            20,  // y position
            'Coins: 0/0', // initial text
            textStyle
        );
        this.scoreText.setScrollFactor(0);  // Fix to camera
        this.scoreText.setDepth(1000);      // Ensure it's always on top
    }

    createSmokeEffect() {
        // Create a particle texture using graphics
        const particleGraphics = this.add.graphics();
        particleGraphics.fillStyle(0xaaaaaa, 1); // Light grey color
        particleGraphics.fillCircle(4, 4, 4);    // Small circle for particle
        
        // Generate texture from the graphics
        particleGraphics.generateTexture('smokeParticle', 8, 8);
        particleGraphics.destroy();
        
        // Create the particles configuration
        const particles = this.add.particles('smokeParticle');
        
        this.smokeEmitter = particles.createEmitter({
            speed: { min: 50, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.6, end: 0 },
            tint: [0xaaaaaa, 0x999999, 0x888888], // Varying shades of grey
            lifespan: 500,
            gravityY: -50,
            quantity: 20,
            blendMode: 'ADD',  // Makes particles blend together nicely
            on: false // Don't start emitting right away
        });
    }

    updateScore() {
        if (this.scoreText) {
            this.scoreText.setText(`Coins: ${this.coinsCollected}/${this.totalCoins}`);
        }
    }
    
    handleResize(gameSize) {
        this.gameWidth = gameSize.width;
        this.gameHeight = gameSize.height;

        if(this.scoreText){
            this.scoreText.setPosition(20,20);
        }

        this.levelLoader.updateDimensions(gameSize.width, gameSize.height);
        this.inputController.handleResize(gameSize.width, gameSize.height);
    }

    update() {
        // Clear any existing velocity
        // this.ball.body.setVelocity(0);
        if(this.inputController)
            this.inputController.update();
    }

    fadeOut(callback) {
        // Create a black rectangle that covers the entire game
        const fade = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000);
        fade.setOrigin(0);
        fade.setDepth(1000); // Make sure it's above everything
        fade.alpha = 0;

        // Create the fade out effect
        this.tweens.add({
            targets: fade,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                if (callback) callback();
            }
        });
    }

    collectCoin(ball, coin) {
        console.log('Coin collected', {
            coinsLeft: this.coins?.getLength(),
            levelLoader: !!this.levelLoader
        });
        
        coin.destroy();
        this.coinsCollected++;
        this.updateScore();
        
        if (this.coins?.getLength() === 0 && this.levelLoader) {
            console.log('All coins collected, starting fade out');
            // Instead of immediately going to next level, fade out first
            this.fadeOut(() => {
                if (this.levelLoader) {
                    this.levelLoader.nextLevel();
                }
            });
        }       
    }

    hitObstacle(ball, obstacle) {
        if (!this.levelLoader) return;
        // Reset ball position to level start
        const currentLevel  = this.levelLoader.levelsData.levels.find(l => l.id === this.levelLoader.currentLevel);
        if (currentLevel ) {
            const relX = currentLevel .player.x / this.levelLoader.BASE_WIDTH;
            const relY = currentLevel .player.y / this.levelLoader.BASE_HEIGHT;
            this.ball.setPosition(
                this.gameWidth * relX,
                this.gameHeight * relY
            );
            this.ball.body.setVelocity(0, 0);
        }
    }

    hitTrap(ball, traps) {
        if (!this.levelLoader) return;
        // Store current position for the smoke effect
        const currentX = ball.x;
        const currentY = ball.y;
        
        // Hide the ball temporarily
        ball.setVisible(false);
        
        // Emit smoke particles at the collision point
        if (this.smokeEmitter) {
            this.smokeEmitter.setPosition(currentX, currentY);
            this.smokeEmitter.explode();
        }
        
        // Add screen shake
        this.cameras.main.shake(200, 0.01);
        
        // Get respawn position
        const currentLevel = this.levelLoader.levelsData.levels.find(
            l => l.id === this.levelLoader.currentLevel
        );
        
        if (currentLevel) {
            const relX = currentLevel.player.x / this.levelLoader.BASE_WIDTH;
            const relY = currentLevel.player.y / this.levelLoader.BASE_HEIGHT;
            
            // Use a timer to delay the repositioning and reappearance
            this.time.delayedCall(300, () => {
                ball.setPosition(
                    this.gameWidth * relX,
                    this.gameHeight * relY
                );
                ball.body.setVelocity(0, 0);
                
                // Create a small puff of smoke at the respawn point
                if (this.smokeEmitter) {
                    this.smokeEmitter.setPosition(this.gameWidth * relX, this.gameHeight * relY);
                    this.smokeEmitter.explode(10); // Smaller puff for respawn
                }
                
                // Make the ball visible again with a fade effect
                ball.setAlpha(0);
                ball.setVisible(true);
                this.tweens.add({
                    targets: ball,
                    alpha: 1,
                    duration: 200,
                    ease: 'Linear'
                });
            });
        }
    }

    cleanup() {
        // Clean up event listeners
        if (this.scale) {
            this.scale.off('resize', this.handleResize, this);
        }
        
        // Clean up components
        if (this.inputController) {
            this.inputController.destroy();
            this.inputController = null;
        }

        if(this.menuRoot) {
            this.menuRoot.unmount();
            this.menuRoot = null;
        }

        // Clean up menu
        if (window.gameControls) {
            window.gameControls = null;
        }

        if (this.scoreText) {
            this.scoreText.destroy();
            this.scoreText = null;
        }
        
        this.coinsCollected = 0;
        this.totalCoins = 0;


        if (this.levelLoader) {
            this.levelLoader.clearLevel();
            this.levelLoader = null;
        }

        if(this.smokeEmitter){
            this.smokeEmitter.stop();
            this.smokeEmitter = null;
        }

        this.tweens.killAll();
    }
}

export default GameScene;
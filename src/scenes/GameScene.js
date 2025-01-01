import InputController from "../controllers/InputController.js";
import LevelLoader from "../utils/LevelLoader.js";
import GameMenu from '../components/GameMenu.js'; 

console.log('GameScene.js loaded');
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // Scene-specific variables
        this.ball = null;
        this.coins = null;
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
        this.setupEventListeners();
        this.setupGameMenu();
    }

    setupGameObjects(){
        try{
            // Initialize level loader first
            this.levelLoader = new LevelLoader(this);
            this.levelLoader.loadLevelsData();
            this.levelLoader.loadLevel(1);
    
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
        if (document.getElementById('game-menu')) {
            ReactDOM.createRoot(document.getElementById('game-menu'))
                .render(React.createElement(GameMenu));
        }
    
        window.gameControls = {
            pauseGame: () => {
                this.gameState.isPaused = true;
                this.scene.pause()
            },
            resumeGame: () => {
                this.gameState.isPaused = false;
                this.scene.resume()
            },
            quitGame: () => {
                this.cleanup();
                this.scene.start('MenuScene');
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

    collectCoin(ball, coin) {
        if (!coin?.active || !this.coins) return;
        
        coin.destroy();
        this.coinsCollected++;
        this.updateScore();
        
        // Check if level is complete
        if (this.coins.countActive() === 0 && this.loadLevel) {
            this.levelLoader.nextLevel();
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

    cleanup() {
        // Clean up event listeners
        this.scale.off('resize', this.handleResize, this);
        
        // Clean up components
        if (this.inputController) {
            this.inputController.destroy();
            this.inputController = null;
        }

        // Clean up game objects
        if (this.coins) this.coins.clear(true, true);
        if (this.obstacles) this.obstacles.clear(true, true);
        if (this.ball) this.ball.destroy();

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
    }
}

export default GameScene;
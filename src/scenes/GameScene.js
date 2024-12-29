import Player from '../entities/Player';
import InputController from '../controllers/InputController';
import GyroController from '../controllers/GyroController';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.player = new Player(this, 400, 300);
        this.inputController = new InputController(this);
        this.gyroController = new GyroController(this);
        
        // Načítanie levelu z JSON
        this.levelLoader.loadLevel(currentLevel);
    }

    update() {
        this.player.update();
        this.inputController.update();
    }
}
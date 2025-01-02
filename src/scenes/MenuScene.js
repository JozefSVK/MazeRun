import Storage from '../utils/Storage.js';

console.log('MenuScene.js loaded');
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Create title
        const title = this.add.text(this.scale.width / 2, this.scale.height / 3, 'Maze Runner', {
            fontSize: '48px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Create continue or start text based on saved progress
        const currentLevel = Storage.getCurrentLevel();
        const startText = currentLevel > 1 ? `Continue (Level ${currentLevel})` : 'Start Game';
        
        const startButton = this.add.text(this.scale.width / 2, this.scale.height / 2, startText, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        const instructionsButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'Instructions', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add New Game button if there's saved progress
        if (currentLevel > 1) {
            const newGameButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, 'New Game', {
                fontSize: '32px',
                fill: '#fff'
            }).setOrigin(0.5);
            
            newGameButton.setInteractive();
            newGameButton.on('pointerup', () => {
                Storage.clearProgress();
                this.scene.start('TransitionScene', { nextLevel: 1 });
            });

            newGameButton.on('pointerover', () => {
                newGameButton.setStyle({ fill: '#ff0' });
            });
            newGameButton.on('pointerout', () => {
                newGameButton.setStyle({ fill: '#fff' });
            });
        }

        startButton.setInteractive();
        instructionsButton.setInteractive();

        startButton.on('pointerup', () => {
            const levelToStart = Storage.getCurrentLevel();
            this.scene.start('TransitionScene', { nextLevel: levelToStart });
        });

        instructionsButton.on('pointerup', () => {
            this.scene.start('InstructionsScene');
        });

        // Add hover effects
        [startButton, instructionsButton].forEach(button => {
            button.on('pointerover', () => {
                button.setStyle({ fill: '#ff0' });
            });
            button.on('pointerout', () => {
                button.setStyle({ fill: '#fff' });
            });
        });
    }
}

export default MenuScene;
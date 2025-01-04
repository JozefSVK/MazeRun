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
        const levelCount = Storage.getLevelCount();
        const startText = levelCount > 1 ? `Continue (Level ${levelCount})` : 'Start Game';
        
        const startButton = this.add.text(this.scale.width / 2, this.scale.height / 2, startText, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        const instructionsButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'Instructions', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add New Game button if there's saved progress
        if (levelCount > 1) {
            const newGameButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, 'New Game', {
                fontSize: '32px',
                fill: '#fff'
            }).setOrigin(0.5);
            
            newGameButton.setInteractive();
            newGameButton.on('pointerup', () => {
                Storage.clearProgress();
                this.scene.start('TransitionScene', { 
                    nextLevel: 1,
                    displayLevel: 1 
                });
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
            const displayLevel = Storage.getLevelCount();
            this.scene.start('TransitionScene', { 
                nextLevel: 4,
                displayLevel: displayLevel 
            });
        });

        instructionsButton.on('pointerup', () => {
            // Save the URL of the current page so we can store the game state
            const currentUrl = window.location.href;
            // Navigate to instructions page
            window.location.href = 'instructions.html';
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
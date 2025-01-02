console.log('MenuScene.js loaded');
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const startButton = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Start Game', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        const instructionsButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'Instructions', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        startButton.setInteractive();
        instructionsButton.setInteractive();

        startButton.on('pointerup', () => {
            // this.scene.start('GameScene');
            this.scene.start('TransitionScene', { nextLevel: 1 });
        });

        instructionsButton.on('pointerup', () => {
            this.scene.start('InstructionsScene');
        });
    }
}

export default MenuScene;
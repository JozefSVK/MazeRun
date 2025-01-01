console.log('InstructionsScene.js loaded');
class InstructionsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InstructionsScene' });
    }

    create() {
        const instructions = this.add.text(this.scale.width / 2, 200, 'How to Play:', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        const backButton = this.add.text(this.scale.width / 2, 500, 'Back to Menu', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        backButton.setInteractive();
        backButton.on('pointerup', () => {
            this.scene.start('MenuScene');
        });
    }
}

export default InstructionsScene;
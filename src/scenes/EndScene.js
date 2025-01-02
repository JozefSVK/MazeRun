class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }

    create() {
        // Start with a black screen fade in
        const fade = this.add.rectangle(0, 0,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000);
        fade.setOrigin(0);
        fade.setDepth(1000);
        fade.alpha = 1;

        // Create congratulations text
        const mainText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            'Congratulations!',
            {
                fontSize: '64px',
                fill: '#fff',
                fontFamily: 'Arial'
            }
        );
        mainText.setOrigin(0.5);
        mainText.setAlpha(0);

        // Create sub text
        const subText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 50,
            'You completed all levels!',
            {
                fontSize: '32px',
                fill: '#fff',
                fontFamily: 'Arial'
            }
        );
        subText.setOrigin(0.5);
        subText.setAlpha(0);

        // Create "Back to Menu" button
        const button = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 150,
            'Back to Menu',
            {
                fontSize: '24px',
                fill: '#fff',
                backgroundColor: '#444',
                padding: { x: 20, y: 10 }
            }
        );
        button.setOrigin(0.5);
        button.setInteractive();
        button.setAlpha(0);

        // Add hover effect to button
        button.on('pointerover', () => button.setStyle({ fill: '#ff0' }));
        button.on('pointerout', () => button.setStyle({ fill: '#fff' }));
        
        // Add click handler
        button.on('pointerdown', () => {
            // Fade out effect before transitioning
            this.tweens.add({
                targets: [fade, mainText, subText, button],
                alpha: 1,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    this.scene.start('MenuScene');
                }
            });
        });

        // Fade in everything
        this.tweens.add({
            targets: [mainText, subText, button],
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });

        // Fade out the black background
        this.tweens.add({
            targets: fade,
            alpha: 0,
            duration: 1000,
            ease: 'Power2'
        });
    }
}

export default EndScene;
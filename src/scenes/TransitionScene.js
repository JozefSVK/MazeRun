import Storage from '../utils/Storage.js';

class TransitionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TransitionScene' });
    }

    init(data) {
        this.nextLevel = data.nextLevel;
        this.displayLevel = data.displayLevel || (Storage.getPlayedLevels().length + 1);
        console.log('TransitionScene received level:', this.nextLevel, 'display level:', this.displayLevel);
    }

    create() {
        // Start with a black screen
        const fade = this.add.rectangle(0, 0,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000
        );
        fade.setOrigin(0);
        fade.setDepth(1000);
        fade.alpha = 1;

        // Create the level text
        const levelText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            `Level ${this.displayLevel}`,
            {
                fontSize: '64px',
                fill: '#fff',
                fontFamily: 'Arial'
            }
        );
        levelText.setOrigin(0.5);
        levelText.setAlpha(0);

        // Tween 1: Fade in the text
        this.tweens.add({
            targets: levelText,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Wait 2 seconds after fade in is complete
                this.time.delayedCall(2000, () => {
                    // Tween 2: Fade out text and black fade
                    this.tweens.add({
                        targets: [levelText, fade],
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            // Start the next level
                            this.scene.start('GameScene', { 
                                level: this.nextLevel,
                                displayLevel: this.displayLevel 
                            });
                        }
                    });
                });
            }
        });

        // Tween 3: Fade out the black screen
        this.tweens.add({
            targets: fade,
            alpha: 0,
            duration: 500,
            delay: 500 // Ensure fade happens after the initial fade-in duration
        });
    }
}

export default TransitionScene;
import GameScene from "./src/scenes/GameScene.js";
import MenuScene from "./src/scenes/MenuScene.js";
import InstructionsScene from "./src/scenes/InstructionScene.js";
import TransitionScene from "./src/scenes/TransitionScene.js";
import EndScene from "./src/scenes/EndScene.js";

window.addEventListener('load', function() {
    console.log('Window loaded');
    console.log('MenuScene:', typeof MenuScene);
    console.log('GameScene:', typeof GameScene);
    console.log('InstructionsScene:', typeof InstructionsScene);
    // Make sure scenes are defined
    if (typeof MenuScene !== 'undefined' && 
        typeof GameScene !== 'undefined' && 
        typeof InstructionsScene !== 'undefined') {
        console.log('All scenes loaded, creating game');
        const config = {
            type: Phaser.AUTO,
            width: 1280,
            height: 720,
            scale: {
                parent: 'game',
                // Fit to window
                mode: Phaser.Scale.FIT,
                // Center vertically and horizontally
                autoCenter: Phaser.Scale.CENTER_BOTH,
                orientation: Phaser.Scale.LANDSCAPE // Force landscape mode
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [MenuScene, GameScene, InstructionsScene, TransitionScene, EndScene]
        };

        window.game = new Phaser.Game(config);
    } else {
        console.error('Scene classes not loaded properly');
    }
});
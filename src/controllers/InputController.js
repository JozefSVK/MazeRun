export default class InputController {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.setupMouseControl();
    }

    update() {
        // Logika ovládania
    }
}
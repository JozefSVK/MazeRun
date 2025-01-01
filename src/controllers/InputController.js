class InputController {
    constructor(scene) {
        this.scene = scene;
        // Wait for next frame to ensure ball exists
        scene.events.once('update', () => {
            this.ball = scene.ball;
        });

        // Input state variables
        this.activeControl = localStorage.getItem('controlType') || 'keyboard';
        this.cursors = null;
        this.gyroEnabled = false;

        // Joystick variables
        this.isDragging = false;
        this.dragStartPos = null;
        this.dragCurrentPos = null;
        this.joystickRadius = Math.min(scene.gameWidth, scene.gameHeight) * 0.05;

        // Create joystick graphics
        this.joystickGraphics = scene.add.graphics();
        this.joystickGraphics.setScrollFactor(0);
        this.joystickGraphics.setDepth(1000);

        // Listen for control changes
        window.addEventListener('controlTypeChanged', (event) => {
            this.activeControl = event.detail.controlType;
            this.setupControls();
        });
    }

    setupControls() {
        this.cleanupControls();
        
        switch (this.activeControl) {
            case 'mouse':
                this.setupVirtualJoystick();
                break;
            case 'gyroscope':
                if (window.DeviceOrientationEvent) {
                    window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
                    this.gyroEnabled = true;
                }
                break;
            case 'keyboard':
                this.cursors = this.scene.input.keyboard.createCursorKeys();
                break;
        }
    }

    cleanupControls() {
        // Cleanup keyboard
        if (this.cursors) {
            this.cursors.up.reset();
            this.cursors.down.reset();
            this.cursors.left.reset();
            this.cursors.right.reset();
            this.cursors = null;
        }

        // Cleanup gyroscope
        if (this.gyroEnabled) {
            window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
            this.gyroEnabled = false;
        }

        // Cleanup joystick
        this.scene.input.off('pointermove');
        this.scene.input.off('pointerdown');
        this.scene.input.off('pointerup');
        this.isDragging = false;
        this.dragStartPos = null;
        this.dragCurrentPos = null;
    }

    setupVirtualJoystick() {
        this.scene.input.on('pointerdown', (pointer) => {
            this.isDragging = true;
            this.dragStartPos = { x: pointer.x, y: pointer.y };
            this.dragCurrentPos = { x: pointer.x, y: pointer.y };
        });

        this.scene.input.on('pointermove', this.handleJoystickMove.bind(this));
        this.scene.input.on('pointerup', this.handleJoystickUp.bind(this));
    }

    handleJoystickMove(pointer) {
        if (!this.isDragging) return;

        const dx = pointer.x - this.dragStartPos.x;
        const dy = pointer.y - this.dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.joystickRadius) {
            this.dragCurrentPos = { x: pointer.x, y: pointer.y };
        } else {
            const angle = Math.atan2(dy, dx);
            this.dragCurrentPos = {
                x: this.dragStartPos.x + Math.cos(angle) * this.joystickRadius,
                y: this.dragStartPos.y + Math.sin(angle) * this.joystickRadius
            };
        }
    }

    handleJoystickUp() {
        this.isDragging = false;
        this.dragStartPos = null;
        this.dragCurrentPos = null;
        this.scene.ball.body.setVelocity(0);
    }

    handleOrientation(event) {
        if (!this.gyroEnabled) return;

        const x = event.gamma;
        const y = event.beta;
        if (x != null && y != null) {
            this.scene.ball.body.setVelocityX(x * 20);
            this.scene.ball.body.setVelocityY(y * 20);
        }
    }

    update() {
        this.joystickGraphics.clear();

        switch (this.activeControl) {
            case 'keyboard':
                this.updateKeyboard();
                break;
            case 'mouse':
                this.updateJoystick();
                break;
            // Gyroscope updates through event listener
        }
    }

    updateKeyboard() {
        if (!this.cursors) return;

        const velocity = { x: 0, y: 0 };

        if (this.cursors.left.isDown) velocity.x = -160;
        else if (this.cursors.right.isDown) velocity.x = 160;

        if (this.cursors.up.isDown) velocity.y = -160;
        else if (this.cursors.down.isDown) velocity.y = 160;

        this.scene.ball.body.setVelocity(velocity.x, velocity.y);
    }

    updateJoystick() {
        if (!this.isDragging) return;

        const dx = this.dragCurrentPos.x - this.dragStartPos.x;
        const dy = this.dragCurrentPos.y - this.dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const normalizedX = dx / Math.max(distance, this.joystickRadius);
        const normalizedY = dy / Math.max(distance, this.joystickRadius);
        
        this.scene.ball.body.setVelocity(normalizedX * 160, normalizedY * 160);

        // Draw joystick
        this.joystickGraphics.lineStyle(2, 0xffffff);
        this.joystickGraphics.strokeCircle(this.dragStartPos.x, this.dragStartPos.y, this.joystickRadius);
        this.joystickGraphics.fillStyle(0x4444ff, 0.8);
        this.joystickGraphics.fillCircle(this.dragCurrentPos.x, this.dragCurrentPos.y, 20);
    }

    handleResize(width, height){
        // Adjust joystick radius based on screen size
        this.joystickRadius = Math.min(width, height) * 0.05; // 10% of smaller dimension

        // If joystick is active, update its position
        if (this.activeControl === 'mouse' && this.dragStartPos) {
            // Maintain relative position or reset to a fixed position
            this.dragStartPos.x = width * 0.2;
            this.dragStartPos.y = height * 0.8;
            
            // If dragging, update current position relative to new start position
            if (this.isDragging && this.dragCurrentPos) {
                const dx = this.dragCurrentPos.x - this.dragStartPos.x;
                const dy = this.dragCurrentPos.y - this.dragStartPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > this.joystickRadius) {
                    const angle = Math.atan2(dy, dx);
                    this.dragCurrentPos = {
                        x: this.dragStartPos.x + Math.cos(angle) * this.joystickRadius,
                        y: this.dragStartPos.y + Math.sin(angle) * this.joystickRadius
                    };
                }
            }
        }
    }

    destroy() {
        this.cleanupControls();
        this.joystickGraphics.destroy();
        window.removeEventListener('controlTypeChanged', this.setupControls);
    }
}

export default InputController;
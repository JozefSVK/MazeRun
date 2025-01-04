class InputController {
    constructor(scene) {
        this.scene = scene;
        // Wait for next frame to ensure ball exists
        scene.events.once('update', () => {
            this.player = scene.player;
        });

        // Input state variables
        this.activeControl = localStorage.getItem('controlType') || 'keyboard';
        this.cursors = null;
        this.gyroEnabled = false;

        // Force settings for Matter.js
        this.forceMultiplier = 0.0001; // Adjust this value to control movement speed
        this.gyroForceMultiplier = 0.00002;
        this.maxForce = 0.01;          // Maximum force that can be applied

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

    async setupControls() {
        this.cleanupControls();
        
        switch (this.activeControl) {
            case 'mouse':
                this.setupVirtualJoystick();
                break;
            case 'gyroscope':
                if (window.DeviceOrientationEvent) {
                    try {
                        // iOS requires permission request
                        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                            const permission = await DeviceOrientationEvent.requestPermission();
                            if (permission === 'granted') {
                                window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
                                this.gyroEnabled = true;
                            }
                        } else {
                            // Android and other devices
                            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
                            this.gyroEnabled = true;
                        }
                    } catch (error) {
                        console.error('Gyroscope permission error:', error);
                    }
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
        // this.scene.ball.body.setVelocity(0);
    }

    handleOrientation(event) {
        if (!this.gyroEnabled || !this.player) return;

        const isLandscape = window.innerWidth > window.innerHeight;
        let x, y;

        if (isLandscape) {
            x = event.gamma * -1;
            y = event.beta;
        } else {
            x = event.beta * -1;
            y = event.gamma * -1;
        }
        
        if (x != null && y != null) {
            // Apply force instead of velocity for Matter.js
            const force = {
                x: y * this.gyroForceMultiplier,
                y: x * this.gyroForceMultiplier
            };
            // Apply force directly to the player
            this.player.applyForce(force);
        }

        // if (!this.gyroEnabled) return;

        // // For landscape, we use beta (y) for x-axis and gamma (x) for y-axis
        // // Multiply by -1 to correct directions
        // const speed = 20;
        // // Check if the game is in landscape mode
        // const isLandscape = window.innerWidth > window.innerHeight;

        // let x, y;

        // if (isLandscape) {
        //     // Swap beta and gamma for landscape
        //     x = event.gamma * -1; // gamma controls X-axis in landscape
        //     y = event.beta;       // beta controls Y-axis in landscape
        // } else {
        //     // Standard portrait mode
        //     x = event.beta * -1;  // beta controls X-axis in portrait
        //     y = event.gamma * -1; // gamma controls Y-axis in portrait
        // }
        
        // if (x != null && y != null) {
        //     this.scene.ball.body.setVelocityX(y * speed);
        //     this.scene.ball.body.setVelocityY(x * speed);
        // }
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
        if (!this.cursors || !this.player) return;

        let forceX = 0;
        let forceY = 0;

        if (this.cursors.left.isDown) forceX = -this.forceMultiplier;
        else if (this.cursors.right.isDown) forceX = this.forceMultiplier;

        if (this.cursors.up.isDown) forceY = -this.forceMultiplier;
        else if (this.cursors.down.isDown) forceY = this.forceMultiplier;

        // Apply force to the Matter.js body
        if (forceX !== 0 || forceY !== 0) {
            this.scene.player.applyForce({ x: forceX, y: forceY });
        }

        // if (!this.cursors) return;

        // const velocity = { x: 0, y: 0 };

        // if (this.cursors.left.isDown) velocity.x = -160;
        // else if (this.cursors.right.isDown) velocity.x = 160;

        // if (this.cursors.up.isDown) velocity.y = -160;
        // else if (this.cursors.down.isDown) velocity.y = 160;

        // this.scene.ball.body.setVelocity(velocity.x, velocity.y);
    }

    updateJoystick() {
        if (!this.isDragging || !this.player) return;
        // if (!this.isDragging) return;

        const dx = this.dragCurrentPos.x - this.dragStartPos.x;
        const dy = this.dragCurrentPos.y - this.dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const normalizedX = dx / Math.max(distance, this.joystickRadius);
        const normalizedY = dy / Math.max(distance, this.joystickRadius);
        
        // this.scene.ball.body.setVelocity(normalizedX * 160, normalizedY * 160);
        // Apply force instead of velocity
        const force = {
            x: normalizedX * this.forceMultiplier,
            y: normalizedY * this.forceMultiplier
        };

        // Apply force directly to the player
        this.player.applyForce(force);

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
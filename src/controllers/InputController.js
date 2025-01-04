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
        this.forceMultiplier = 0.0002; // Adjust this value to control movement speed
        this.gyroForceMultiplier = 0.00002;
        this.maxForce = 0.01;          // Maximum force that can be applied

        // Add acceleration handling
        this.currentForce = { x: 0, y: 0 };
        this.acceleration = 0.2;           // How quickly force builds up
        this.deceleration = 0.15;          // How quickly force decreases

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


        // Adjust force multiplier for gyroscope
        this.gyroForceMultiplier = 0.0003; // Increased base force
        // Add gyroscope smoothing properties
        this.gyroValues = {
            x: 0,
            y: 0
        };
        this.smoothingFactor = 0.2; // Lower = smoother but more latency
        this.gyroThreshold = 0.1;   // Minimum change required to register movement
        this.maxGyroAngle = 45;     // Maximum angle to consider for input

        // Add acceleration curve parameters
        this.minBoostThreshold = 15;   // Angle at which boost starts
        this.boostMultiplier = 2.5;    // How much extra force to apply during boost

        this.wasdKeys = null
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
                // Set up WASD keys
                this.wasdKeys = {
                    W: this.scene.input.keyboard.addKey('W'),
                    A: this.scene.input.keyboard.addKey('A'),
                    S: this.scene.input.keyboard.addKey('S'),
                    D: this.scene.input.keyboard.addKey('D')
                };
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

        // Cleanup WASD keys
        if (this.wasdKeys) {
            this.wasdKeys.W.reset();
            this.wasdKeys.A.reset();
            this.wasdKeys.S.reset();
            this.wasdKeys.D.reset();
            this.wasdKeys = null;
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
        let rawX, rawY;

        if (isLandscape) {
            rawX = event.gamma * -1;
            rawY = event.beta;
        } else {
            rawX = event.beta * -1;
            rawY = event.gamma * -1;
        }

        if (rawX != null && rawY != null) {
            // Clamp values to max angle
            rawX = Math.max(Math.min(rawX, this.maxGyroAngle), -this.maxGyroAngle);
            rawY = Math.max(Math.min(rawY, this.maxGyroAngle), -this.maxGyroAngle);

            // Smooth the values
            this.gyroValues.x += (rawX - this.gyroValues.x) * this.smoothingFactor;
            this.gyroValues.y += (rawY - this.gyroValues.y) * this.smoothingFactor;

            // Apply dead zone
            let x = Math.abs(this.gyroValues.x) < this.gyroThreshold ? 0 : this.gyroValues.x;
            let y = Math.abs(this.gyroValues.y) < this.gyroThreshold ? 0 : this.gyroValues.y;

            // Calculate boost based on tilt angle
            const xBoost = Math.abs(x) > this.minBoostThreshold ? this.boostMultiplier : 1;
            const yBoost = Math.abs(y) > this.minBoostThreshold ? this.boostMultiplier : 1;

            // Apply non-linear acceleration curve
            x = Math.sign(x) * Math.pow(Math.abs(x) / this.maxGyroAngle, 1.5) * xBoost;
            y = Math.sign(y) * Math.pow(Math.abs(y) / this.maxGyroAngle, 1.5) * yBoost;

            // Apply force with boosted values
            const force = {
                x: y * this.gyroForceMultiplier,
                y: x * this.gyroForceMultiplier
            };

            // Apply additional boost for quick movements
            if (Math.abs(rawX - this.gyroValues.x) > 10 || Math.abs(rawY - this.gyroValues.y) > 10) {
                force.x *= 1.5;
                force.y *= 1.5;
            }

            // Only apply force if it's significant enough
            if (Math.abs(force.x) > 0.00001 || Math.abs(force.y) > 0.00001) {
                this.player.applyForce(force);
            }
        }
    }

    // Helper method to calculate velocity-based force scaling
    getVelocityScale(velocity) {
        const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (currentSpeed < 2) {
            return 1.5; // Boost at low speeds
        } else if (currentSpeed < 5) {
            return 1.2; // Moderate boost at medium speeds
        }
        return 1; // Normal force at high speeds
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

        // Target force based on input
        const targetForce = {
            x: 0,
            y: 0
        };

        // Check arrow keys
        if (this.cursors) {
            if (this.cursors.left.isDown || (this.wasdKeys && this.wasdKeys.A.isDown)) {
                targetForce.x = -this.forceMultiplier;
            }
            else if (this.cursors.right.isDown || (this.wasdKeys && this.wasdKeys.D.isDown)) {
                targetForce.x = this.forceMultiplier;
            }

            if (this.cursors.up.isDown || (this.wasdKeys && this.wasdKeys.W.isDown)) {
                targetForce.y = -this.forceMultiplier;
            }
            else if (this.cursors.down.isDown || (this.wasdKeys && this.wasdKeys.S.isDown)) {
                targetForce.y = this.forceMultiplier;
            }
        }

        // Smoothly interpolate current force towards target force
        this.currentForce.x = this.interpolateForce(this.currentForce.x, targetForce.x);
        this.currentForce.y = this.interpolateForce(this.currentForce.y, targetForce.y);

        // Apply the interpolated force
        if (this.currentForce.x !== 0 || this.currentForce.y !== 0) {
            this.player.applyForce(this.currentForce);
        }
        // if (!this.cursors) return;

        // const velocity = { x: 0, y: 0 };

        // if (this.cursors.left.isDown) velocity.x = -160;
        // else if (this.cursors.right.isDown) velocity.x = 160;

        // if (this.cursors.up.isDown) velocity.y = -160;
        // else if (this.cursors.down.isDown) velocity.y = 160;

        // this.scene.ball.body.setVelocity(velocity.x, velocity.y);
    }

    // Helper method for smooth force interpolation
    interpolateForce(current, target) {
        if (target !== 0) {
            // Accelerate
            return current + (target - current) * this.acceleration;
        } else {
            // Decelerate
            return current * (1 - this.deceleration);
        }
    }

    updateJoystick() {
        if (!this.isDragging || !this.player) return;
        // if (!this.isDragging) return;

        const dx = this.dragCurrentPos.x - this.dragStartPos.x;
        const dy = this.dragCurrentPos.y - this.dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const normalizedX = dx / Math.max(distance, this.joystickRadius);
        const normalizedY = dy / Math.max(distance, this.joystickRadius);

        // Apply quadratic scaling for finer control at low values and more power at high values
        const scaledX = Math.sign(normalizedX) * (normalizedX * normalizedX);
        const scaledY = Math.sign(normalizedY) * (normalizedY * normalizedY);
        
        // this.scene.ball.body.setVelocity(normalizedX * 160, normalizedY * 160);
        // Apply force instead of velocity
        const force = {
            x: scaledX * this.forceMultiplier,
            y: scaledY * this.forceMultiplier
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
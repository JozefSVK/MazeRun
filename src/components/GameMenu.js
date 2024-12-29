// GameMenu.js
const GameMenu = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [controlType, setControlType] = React.useState(() => {
        // Load saved preference from localStorage or use default
        return localStorage.getItem('controlType') || 
            (window.DeviceOrientationEvent ? 'gyroscope' : 'keyboard');
    });

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (window.game) {
            if (!isMenuOpen) {
                window.game.scene.pause('GameScene');
            } else {
                window.game.scene.resume('GameScene');
            }
        }
    };

    const handleQuit = () => {
        if (window.game) {
            window.game.scene.start('MenuScene');
        }
    };

    const handleControlChange = (newControl) => {
        setControlType(newControl);
        localStorage.setItem('controlType', newControl);
        // Emit custom event to notify game about control change
        window.dispatchEvent(new CustomEvent('controlTypeChanged', { 
            detail: { controlType: newControl } 
        }));
    };

    // Determine which controls to show based on device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasGyroscope = window.DeviceOrientationEvent;

    return React.createElement("div", null, [
        // Gear icon button
        React.createElement("button", {
            onClick: toggleMenu,
            className: "fixed top-4 right-4 bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors z-50",
            key: "gear-button"
        }, 
            React.createElement("div", { 
                className: "w-6 h-6 text-white"
            }, "⚙️")
        ),
        
        // Modal overlay
        isMenuOpen && React.createElement("div", {
            className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40",
            key: "modal-overlay",
            onClick: toggleMenu
        },
            // Menu container
            React.createElement("div", {
                className: "bg-white rounded-lg shadow-lg p-6 w-80",
                onClick: e => e.stopPropagation()
            }, [
                // Title
                React.createElement("h2", {
                    className: "text-xl font-bold mb-4 text-center text-gray-800",
                    key: "menu-title"
                }, "Game Menu"),

                // Controls section
                React.createElement("div", {
                    className: "mb-4",
                    key: "controls-section"
                }, [
                    React.createElement("h3", {
                        className: "text-lg font-semibold mb-2 text-gray-700",
                        key: "controls-title"
                    }, "Controls"),
                    
                    // Control options for desktop
                    !isMobile && React.createElement("div", {
                        className: "space-y-2",
                        key: "desktop-controls"
                    }, [
                        // Keyboard option
                        React.createElement("button", {
                            onClick: () => handleControlChange('keyboard'),
                            className: `w-full px-4 py-2 rounded ${
                                controlType === 'keyboard' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`,
                            key: "keyboard-button"
                        }, "Keyboard (WASD/Arrows)"),
                        
                        // Mouse option
                        React.createElement("button", {
                            onClick: () => handleControlChange('mouse'),
                            className: `w-full px-4 py-2 rounded ${
                                controlType === 'mouse' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`,
                            key: "mouse-button"
                        }, "Mouse")
                    ]),

                    // Control options for mobile
                    isMobile && React.createElement("div", {
                        className: "space-y-2",
                        key: "mobile-controls"
                    }, [
                        // Touch/Mouse option
                        React.createElement("button", {
                            onClick: () => handleControlChange('mouse'),
                            className: `w-full px-4 py-2 rounded ${
                                controlType === 'mouse' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`,
                            key: "touch-button"
                        }, "Touch/Mouse"),
                        
                        // Gyroscope option (if available)
                        hasGyroscope && React.createElement("button", {
                            onClick: () => handleControlChange('gyroscope'),
                            className: `w-full px-4 py-2 rounded ${
                                controlType === 'gyroscope' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`,
                            key: "gyro-button"
                        }, "Gyroscope")
                    ])
                ]),

                // Divider
                React.createElement("hr", {
                    className: "my-4 border-gray-200",
                    key: "divider"
                }),
                
                // Continue button
                React.createElement("button", {
                    onClick: toggleMenu,
                    className: "w-full mb-2 px-4 py-2 text-gray-800 hover:bg-gray-100 rounded transition-colors",
                    key: "continue-button"
                }, "Continue"),
                
                // Quit button
                React.createElement("button", {
                    onClick: handleQuit,
                    className: "w-full px-4 py-2 text-gray-800 hover:bg-gray-100 rounded transition-colors",
                    key: "quit-button"
                }, "Quit")
            ])
        )
    ]);
};

// Mount component
const menuContainer = document.getElementById('game-menu');
if (menuContainer) {
    ReactDOM.createRoot(menuContainer).render(React.createElement(GameMenu));
}
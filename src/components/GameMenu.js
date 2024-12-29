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
        if (!isMenuOpen) {
            window.gameControls?.pauseGame();
        } else {
            window.gameControls?.resumeGame();
        }
    };

    const handleQuit = () => {
        window.gameControls?.quitGame();
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
            className: "fixed top-4 right-4 bg-gray-800 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors z-50",
            key: "gear-button"
        }, 
            React.createElement("i", { 
                className: "fas fa-gear text-white text-xl"
            })
        ),
        
        // Modal overlay
        isMenuOpen && React.createElement("div", {
            className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40",
            onClick: toggleMenu,
            key: "modal-overlay"
        },
            // Menu container
            React.createElement("div", {
                className: "bg-white rounded-lg shadow-lg p-6 min-w-[320px]",
                onClick: e => e.stopPropagation()
            }, [
                // Game Menu heading
                React.createElement("h2", {
                    className: "text-2xl font-bold text-center text-gray-800 mb-6",
                    key: "menu-title"
                }, "Game Menu"),

                // Controls section
                React.createElement("h3", {
                    className: "text-lg font-semibold text-gray-700 mb-4",
                    key: "controls-title"
                }, "Controls"),

                // Controls container
                React.createElement("div", {
                    className: "flex justify-center gap-8 mb-6",
                    key: "controls"
                }, [
                    // Keyboard control (PC only)
                    !isMobile && React.createElement("button", {
                        onClick: () => {
                            setControlType('keyboard');
                            localStorage.setItem('controlType', 'keyboard');
                            window.dispatchEvent(new CustomEvent('controlTypeChanged', { 
                                detail: { controlType: 'keyboard' } 
                            }));
                        },
                        className: `flex flex-col items-center p-4 rounded-lg transition-colors ${
                            controlType === 'keyboard' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'hover:bg-gray-100'
                        }`,
                        key: "keyboard"
                    }, [
                        React.createElement("i", { 
                            className: "fas fa-keyboard text-3xl mb-2"
                        }),
                        React.createElement("span", { 
                            className: "text-sm"
                        }, "Keyboard")
                    ]),

                    // Mouse/Joystick control (all devices)
                    React.createElement("button", {
                        onClick: () => {
                            setControlType('mouse');
                            localStorage.setItem('controlType', 'mouse');
                            window.dispatchEvent(new CustomEvent('controlTypeChanged', { 
                                detail: { controlType: 'mouse' } 
                            }));
                        },
                        className: `flex flex-col items-center p-4 rounded-lg transition-colors ${
                            controlType === 'mouse' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'hover:bg-gray-100'
                        }`,
                        key: "mouse"
                    }, [
                        React.createElement("i", { 
                            className: isMobile ? "fas fa-hand-pointer" : "fas fa-mouse"
                        }, " "),
                        React.createElement("span", { 
                            className: "text-sm mt-2"
                        }, isMobile ? "Touch" : "Mouse")
                    ]),

                    // Gyroscope control (only on supported mobile devices)
                    (isMobile && hasGyroscope) && React.createElement("button", {
                        onClick: () => {
                            setControlType('gyroscope');
                            localStorage.setItem('controlType', 'gyroscope');
                            window.dispatchEvent(new CustomEvent('controlTypeChanged', { 
                                detail: { controlType: 'gyroscope' } 
                            }));
                        },
                        className: `flex flex-col items-center p-4 rounded-lg transition-colors ${
                            controlType === 'gyroscope' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'hover:bg-gray-100'
                        }`,
                        key: "gyroscope"
                    }, [
                        React.createElement("i", { 
                            className: "fas fa-mobile-alt text-3xl mb-2"
                        }),
                        React.createElement("span", { 
                            className: "text-sm"
                        }, "Gyroscope")
                    ])
                ]),

                // Divider
                React.createElement("hr", {
                    className: "my-6 border-gray-200",
                    key: "divider"
                }),

                // Buttons
                React.createElement("div", {
                    className: "flex flex-col gap-2",
                    key: "buttons"
                }, [
                    React.createElement("button", {
                        onClick: toggleMenu,
                        className: "w-full px-4 py-2 text-gray-800 hover:bg-gray-100 rounded transition-colors",
                        key: "continue"
                    }, "Continue"),
                    React.createElement("button", {
                        onClick: handleQuit,
                        className: "w-full px-4 py-2 text-gray-800 hover:bg-gray-100 rounded transition-colors",
                        key: "quit"
                    }, "Quit")
                ])
            ])
        )
    ]);
};

// Mount component
const menuContainer = document.getElementById('game-menu');
if (menuContainer) {
    ReactDOM.createRoot(menuContainer).render(React.createElement(GameMenu));
}
const GameMenu = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasGyroscope = window.DeviceOrientationEvent;
    
    // For mobile, force gyroscope if available
    const [controlType, setControlType] = React.useState(() => {
        if (isMobile && hasGyroscope) {
            return 'gyroscope';
        }
        return localStorage.getItem('controlType') || 'keyboard';
    });

    // Add this useEffect here
    React.useEffect(() => {
        return () => {
            window.gameControls?.resumeGame();
            window.gameControls = null;
        };
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (!isMenuOpen) {
            window.gameControls?.pauseGame();
        } else {
            window.gameControls?.resumeGame();
        }
    };

    const handleQuit = () => {
        try {
            if (window.gameControls?.quitGame) {
                setIsMenuOpen(false);
                window.gameControls.quitGame();
            }
        } catch (error) {
            console.error('Error during quit:', error);
        }
    };

    const handleControlChange = (newControl) => {
        // Don't allow control changes on mobile
        if (isMobile) return;
        
        setControlType(newControl);
        localStorage.setItem('controlType', newControl);
        window.dispatchEvent(new CustomEvent('controlTypeChanged', { 
            detail: { controlType: newControl } 
        }));
    };

    return React.createElement("div", null, [
        // Gear icon button
        React.createElement("button", {
            onClick: toggleMenu,
            className: "absolute top-[20px] right-[20px] bg-gray-800 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors z-50",
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

                // Only show controls section for desktop
                !isMobile && [
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
                        // Keyboard control
                        React.createElement("button", {
                            onClick: () => handleControlChange('keyboard'),
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

                        // Mouse control
                        React.createElement("button", {
                            onClick: () => handleControlChange('mouse'),
                            className: `flex flex-col items-center p-4 rounded-lg transition-colors ${
                                controlType === 'mouse' 
                                    ? 'bg-blue-100 text-blue-600' 
                                    : 'hover:bg-gray-100'
                            }`,
                            key: "mouse"
                        }, [
                            React.createElement("i", { 
                                className: "fas fa-mouse"
                            }),
                            React.createElement("span", { 
                                className: "text-sm mt-2"
                            }, "Mouse")
                        ])
                    ]),

                    // Divider
                    React.createElement("hr", {
                        className: "my-6 border-gray-200",
                        key: "divider"
                    })
                ],

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

export default GameMenu;
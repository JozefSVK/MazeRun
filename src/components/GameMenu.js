const GameMenu = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isHintOpen, setIsHintOpen] = React.useState(false);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasGyroscope = window.DeviceOrientationEvent;

    const [controlType, setControlType] = React.useState(() => {
        const savedControl = localStorage.getItem('controlType');
        if (isMobile && hasGyroscope) {
            return savedControl || 'gyroscope';
        }
        return savedControl || 'keyboard';
    });

    React.useEffect(() => {
        localStorage.setItem('controlType', controlType);
        window.dispatchEvent(new CustomEvent('controlTypeChanged', { 
            detail: { controlType: controlType } 
        }));
    }, [controlType]);

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

    const toggleHint = () => {
        setIsHintOpen(!isHintOpen);
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
        setControlType(newControl);
    };

    // Common button style classes
    const actionButtonClasses = "transition-colors duration-200 hover:text-yellow-300 text-white text-2xl py-2 px-4 rounded text-center mb-4 border-2 border-white hover:border-yellow-300";
    const controlButtonClasses = "flex flex-col items-center p-4 rounded-lg transition-colors border-2 hover:border-yellow-300 hover:text-yellow-300 text-white";
    const iconButtonClasses = "absolute w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors z-50 text-white";

    return React.createElement("div", null, [
        // Gear icon button
        React.createElement("button", {
            onClick: toggleMenu,
            className: `${iconButtonClasses} top-4 right-4`,
            key: "gear-button"
        }, 
            React.createElement("i", { 
                className: "fas fa-gear text-xl"
            })
        ),
        
        // Hint icon button
        React.createElement("button", {
            onClick: toggleHint,
            className: `${iconButtonClasses} top-20 right-4`,
            key: "hint-button"
        }, 
            React.createElement("i", { 
                className: "fas fa-question text-xl"
            })
        ),

        // Menu Modal
        isMenuOpen && React.createElement("div", {
            className: "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40",
            onClick: toggleMenu,
            key: "modal-overlay"
        },
            React.createElement("div", {
                className: "w-full max-w-md p-6",
                onClick: e => e.stopPropagation()
            }, [
                React.createElement("h2", {
                    className: "text-4xl font-bold text-center text-white mb-8",
                    key: "menu-title"
                }, "Game Menu"),

                React.createElement("h3", {
                    className: "text-2xl text-white mb-4 text-center",
                    key: "controls-title"
                }, "Controls"),

                // Desktop/Mobile Controls
                React.createElement("div", {
                    className: "flex justify-center gap-8 mb-6",
                    key: "controls-container"
                },
                    isMobile ? [
                        hasGyroscope && React.createElement("button", {
                            onClick: () => handleControlChange('gyroscope'),
                            className: `${controlButtonClasses} ${controlType === 'gyroscope' ? 'bg-yellow-300 bg-opacity-20 border-yellow-300 text-yellow-300' : 'border-white'}`,
                            key: "gyroscope"
                        }, [
                            React.createElement("i", { 
                                className: "fas fa-mobile-alt text-3xl mb-2",
                                key: "gyro-icon"
                            }),
                            React.createElement("span", { 
                                className: "text-sm",
                                key: "gyro-text"
                            }, "Gyroscope")
                        ]),
                        React.createElement("button", {
                            onClick: () => handleControlChange('touch'),
                            className: `${controlButtonClasses} ${controlType === 'touch' ? 'bg-yellow-300 bg-opacity-20 border-yellow-300 text-yellow-300' : 'border-white'}`,
                            key: "touch"
                        }, [
                            React.createElement("i", { 
                                className: "fas fa-gamepad text-3xl mb-2",
                                key: "touch-icon"
                            }),
                            React.createElement("span", { 
                                className: "text-sm",
                                key: "touch-text"
                            }, "Touch")
                        ])
                    ] : [
                        React.createElement("button", {
                            onClick: () => handleControlChange('keyboard'),
                            className: `${controlButtonClasses} ${controlType === 'keyboard' ? 'bg-yellow-300 bg-opacity-20 border-yellow-300 text-yellow-300' : 'border-white'}`,
                            key: "keyboard"
                        }, [
                            React.createElement("i", { 
                                className: "fas fa-keyboard text-3xl mb-2",
                                key: "keyboard-icon"
                            }),
                            React.createElement("span", { 
                                className: "text-sm",
                                key: "keyboard-text"
                            }, "Keyboard")
                        ]),
                        React.createElement("button", {
                            onClick: () => handleControlChange('mouse'),
                            className: `${controlButtonClasses} ${controlType === 'mouse' ? 'bg-yellow-300 bg-opacity-20 border-yellow-300 text-yellow-300' : 'border-white'}`,
                            key: "mouse"
                        }, [
                            React.createElement("i", { 
                                className: "fas fa-mouse text-3xl mb-2",
                                key: "mouse-icon"
                            }),
                            React.createElement("span", { 
                                className: "text-sm",
                                key: "mouse-text"
                            }, "Mouse")
                        ])
                    ]
                ),

                React.createElement("hr", {
                    className: "my-6 border-gray-600",
                    key: "divider"
                }),

                React.createElement("button", {
                    onClick: toggleMenu,
                    className: actionButtonClasses + " w-full",
                    key: "continue"
                }, "Continue"),

                React.createElement("button", {
                    onClick: handleQuit,
                    className: actionButtonClasses + " w-full",
                    key: "quit"
                }, "Quit")
            ])
        ),

        // Hint Modal
        isHintOpen && React.createElement("div", {
            className: "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40",
            onClick: toggleHint,
            key: "hint-modal-overlay"
        },
            React.createElement("div", {
                className: "w-full max-w-md p-6",
                onClick: e => e.stopPropagation()
            }, [
                React.createElement("h2", {
                    className: "text-4xl font-bold text-center text-white mb-8",
                    key: "hint-title"
                }, "Game Hints"),

                React.createElement("div", {
                    className: "text-white text-xl space-y-4 mb-8",
                    key: "hint-content"
                }, [
                    React.createElement("p", {
                        className: "text-center",
                        key: "hint-1"
                    }, "Collect all coins to advance to the next level"),
                    React.createElement("p", {
                        className: "text-center",
                        key: "hint-2"
                    }, "Avoid traps"),
                    React.createElement("p", {
                        className: "text-center",
                        key: "hint-3"
                    }, "Use the controls menu to change input method")
                ]),

                React.createElement("button", {
                    onClick: toggleHint,
                    className: actionButtonClasses + " w-full",
                    key: "hint-close"
                }, "Got it!")
            ])
        )
    ]);
};

export default GameMenu;
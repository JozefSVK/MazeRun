// register-sw.js
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker registration successful:', registration);
        } catch (error) {
            console.log('ServiceWorker registration failed:', error);
        }
    });
}

// Handle PWA installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'block';
    }
});

// Handle install button click
// const installButton = document.getElementById('install-button');
// if (installButton) {
//     installButton.addEventListener('click', async () => {
//         if (deferredPrompt) {
//             deferredPrompt.prompt();
//             const result = await deferredPrompt.userChoice;
//             if (result.outcome === 'accepted') {
//                 console.log('Game installed as PWA');
//             }
//             deferredPrompt = null;
//             installButton.style.display = 'none';
//         }
//     });
// }

// Handle screen orientation
window.addEventListener('load', () => {
    if (screen.orientation) {
        screen.orientation.lock('landscape').catch((error) => {
            console.log('Unable to lock screen orientation:', error);
        });
    }
});
const CACHE_NAME = 'maze-runner-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/game.js',
    '/manifest.json',
    '/register-sw.js',
    // Scenes
    '/src/scenes/GameScene.js',
    '/src/scenes/MenuScene.js',
    '/src/scenes/InstructionsScene.js',
    '/src/scenes/TransitionScene.js',
    '/src/scenes/EndScene.js',
    // Components
    '/src/components/GameMenu.js',
    // Controllers
    '/src/controllers/InputController.js',
    // Entities
    '/src/entities/Coin.js',
    '/src/entities/Obstacle.js',
    '/src/entities/Player.js',
    '/src/entities/Traps.js',
    // Utils
    '/src/utils/LevelLoader.js',
    '/src/utils/Storage.js',
    // Styles
    '/css/style.css',
    '/css/instructions.css',
    // Data
    '/data/config.json',
    '/data/levels.json',
    // Assets
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});


self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
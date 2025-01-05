const CACHE_NAME = 'maze-runner-v1';
const urlsToCache = [
    './',  // Changed from '/'
    './index.html',  // Changed from '/index.html'
    './game.js',
    './manifest.json',
    './register-sw.js',
    // Scenes
    './src/scenes/GameScene.js',
    './src/scenes/MenuScene.js',
    './src/scenes/InstructionsScene.js',
    './src/scenes/TransitionScene.js',
    './src/scenes/EndScene.js',
    // Components
    './src/components/GameMenu.js',
    // Controllers
    './src/controllers/InputController.js',
    // Entities
    './src/entities/Coin.js',
    './src/entities/Obstacle.js',
    './src/entities/Player.js',
    './src/entities/Traps.js',
    // Utils
    './src/utils/LevelLoader.js',
    './src/utils/Storage.js',
    // Styles
    './css/style.css',
    './css/instructions.css',
    // Data
    './data/config.json',
    './data/levels.json',
    // Assets
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-512x512.png',
    // External Resources
    'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.55.2/phaser.min.js',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('Cache addAll failed:', error);
                    throw error;
                });
            })
    );
});

self.addEventListener('fetch', event => {
    // Handle navigation requests separately
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match('index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(async response => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                try {
                    const fetchResponse = await fetch(event.request);
                    
                    // Check if we received a valid response
                    if (!fetchResponse || fetchResponse.status !== 200) {
                        return fetchResponse;
                    }

                    // Clone the response
                    const responseToCache = fetchResponse.clone();

                    // Cache the fetched response
                    const cache = await caches.open(CACHE_NAME);
                    if (!event.request.url.includes('cdn.tailwindcss.com')) {
                        cache.put(event.request, responseToCache);
                    }

                    return fetchResponse;
                } catch (error) {
                    console.error('Fetch failed:', error);
                    
                    // Return appropriate fallback
                    if (event.request.url.match(/\.(jpg|png|gif|svg)$/)) {
                        return caches.match('/assets/icons/icon-192x192.png');
                    }
                    return new Response('Network error occurred', {
                        status: 408,
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    });
                }
            })
    );
});


self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Enable immediate use of updated service worker
            self.clients.claim()
        ])
    );
});
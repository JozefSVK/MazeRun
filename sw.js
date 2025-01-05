const CACHE_NAME = 'maze-runner-v1';
const urlsToCache = [
    './',  // Changed from '/'
    './index.html',  // Changed from '/index.html'
    './instructions.html',
    './game.js',
    './manifest.json',
    './register-sw.js',
    // Game modules
    './src/scenes/GameScene.js',
    './src/scenes/MenuScene.js',
    './src/scenes/TransitionScene.js',
    './src/scenes/EndScene.js',
    './src/components/GameMenu.js',
    './src/entities/Coin.js',
    './src/entities/Player.js',
    './src/utils/LevelLoader.js',
    './src/utils/Storage.js',
    './css/style.css',
    './css/instructions.css',
    './data/levels.json',
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-512x512.png',
    './src/entities/rotatingBlade.js',
    './src/entities/spikeball.js',
    './assets/icons/gear.png',
    './assets/icons/question.png',
    './assets/icons/keyboard.png',
    './assets/icons/mouse.png',
    './assets/icons/rotation.png'
];

const externalUrls = [
    'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.55.2/phaser.min.js',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // First cache local files
                return cache.addAll(urlsToCache)
                    .then(() => {
                        // Then try to cache external files individually
                        return Promise.allSettled(
                            externalUrls.map(url =>
                                fetch(url)
                                    .then(response => {
                                        if (response.ok) {
                                            return cache.put(url, response);
                                        }
                                        throw new Error(`Failed to fetch ${url}`);
                                    })
                                    .catch(error => console.warn('Could not cache:', url, error))
                            )
                        );
                    });
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(async response => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                try {
                    // Clone the request in case we need to use it twice
                    const fetchRequest = event.request.clone();
                    const networkResponse = await fetch(fetchRequest);
                    
                    // Check if we received a valid response
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }

                    // Clone the response before caching it
                    const responseToCache = networkResponse.clone();
                    
                    // Cache the response
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(event.request, responseToCache);
                    
                    return networkResponse;
                } catch (error) {
                    console.error('Fetch failed:', error);
                    
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }

                    throw error;
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
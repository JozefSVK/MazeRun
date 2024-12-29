const CACHE_NAME = 'maze-runner-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/game.js',
    '/assets/ball.png',
    '/assets/coin.png',
    '/assets/obstacle.png'
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
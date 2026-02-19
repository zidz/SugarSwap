const CACHE_NAME = 'sugarswap-cache-v2';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/sw.js',
    '/static/icons/icon-192.png',
    '/static/icons/icon-512.png',
    '/static/audio/jackpot_win.mp3',
    '/static/audio/scan_success.mp3',
    '/static/audio/streak_fire.mp3',
    '/static/favicon.ico',
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
];

// Install service worker and cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(STATIC_ASSETS);
            })
    );
});

// Activate service worker and clean up old caches
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

// Fetch event: Cache-first for all GET requests, except for API calls
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    // For API calls, use a network-first strategy.
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(JSON.stringify({ status: 'offline' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // For all other GET requests, use a cache-first strategy.
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(networkResponse => {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    return networkResponse;
                });
            })
    );
});

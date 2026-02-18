const CACHE_NAME = 'sugarswap-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
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

// Fetch event: Cache-first for static assets, Network-first for API calls
self.addEventListener('fetch', event => {
    const isApiCall = event.request.url.includes('/api/');
    const isStaticAsset = STATIC_ASSETS.some(asset => event.request.url.endsWith(asset));

    if (isApiCall) {
        // Network-first for API calls
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache the new response
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    return response;
                })
                .catch(() => {
                    // If network fails, try to get from cache
                    return caches.match(event.request);
                })
        );
    } else if (isStaticAsset) {
        // Cache-first for static assets
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    // Not in cache - fetch and cache
                    return fetch(event.request).then(
                        networkResponse => {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                            return networkResponse;
                        }
                    );
                })
        );
    }
});

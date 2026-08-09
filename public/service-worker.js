const CACHE_NAME = 'susanasland-v1';

// Stable PWA assets that keep their filename across builds.
// Game code assets (hashed JS/CSS) are cached at runtime via fetch.
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/icons/icon-152.png',
    '/assets/icons/icon-167.png',
    '/assets/icons/icon-180.png',
    '/assets/splash/splash-1136x640.png',
    '/assets/splash/splash-1334x750.png',
    '/assets/splash/splash-1792x828.png',
    '/assets/splash/splash-2048x1536.png',
    '/assets/splash/splash-2208x1242.png',
    '/assets/splash/splash-2224x1668.png',
    '/assets/splash/splash-2388x1668.png',
    '/assets/splash/splash-2436x1125.png',
    '/assets/splash/splash-2688x1242.png',
    '/assets/splash/splash-2732x2048.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached version immediately if available, otherwise fetch and cache.
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                // Only cache valid GET responses for runtime assets.
                if (
                    !response ||
                    response.status !== 200 ||
                    event.request.method !== 'GET'
                ) {
                    return response;
                }

                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });

                return response;
            }).catch(() => {
                return caches.match(event.request);
            });
        })
    );
});

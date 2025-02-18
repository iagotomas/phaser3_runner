const CACHE_NAME = 'little-games-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
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
                // Add all your game assets here
            ]);
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
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
}); 
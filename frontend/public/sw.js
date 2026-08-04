const CACHE_NAME = 'pkwl-property-v2';

// Install - skip waiting immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate - purge all old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch - Always fetch fresh from network for pages and JS/CSS
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    // Do not intercept network requests for dynamic pages or APIs
    return;
});

const CACHE_NAME = 'sunday-setlist-cache-v2';
const DATA_CACHE_NAME = 'setlist-data-cache-v1';

const urlsToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/output.css',
    '/manifest.json',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'
];

// Install event: Precache app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Pre-caching app shell...');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting(); // Activate immediately
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME && name !== DATA_CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    }
                })
            )
        )
    );
    self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
    // Firestore data requests (Network First)
    if (event.request.url.includes('firestore.googleapis.com')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache =>
                fetch(event.request)
                    .then(response => {
                        if (response.status === 200 && event.request.method === 'GET') {
                            cache.put(event.request, response.clone());
                        } else if (event.request.method !== 'GET') {
                            console.warn('[SW] Skipping non-GET request:', event.request.url);
                        }
                        return response;
                    })
                    .catch(() => {
                        console.warn('[SW] Network failed. Trying cache for:', event.request.url);
                        return cache.match(event.request);
                    })
            )
        );
        return;
    }

    // Static assets (Cache First)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

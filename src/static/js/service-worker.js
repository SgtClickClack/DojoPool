const CACHE_NAME = 'dojopool-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache
const STATIC_RESOURCES = [
    '/',
    '/static/css/style.css',
    '/static/css/base.css',
    '/static/css/components.css',
    '/static/css/layout.css',
    '/static/css/notifications.css',
    '/static/js/main.js',
    '/static/js/utils.js',
    '/static/js/components.js',
    '/static/js/navigation.js',
    '/static/js/notifications.js',
    '/static/manifest.json',
    OFFLINE_URL,
    // Add icons
    '/static/icons/icon-72x72.png',
    '/static/icons/icon-96x96.png',
    '/static/icons/icon-128x128.png',
    '/static/icons/icon-144x144.png',
    '/static/icons/icon-152x152.png',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-384x384.png',
    '/static/icons/icon-512x512.png'
];

// API routes to cache
const API_ROUTES = [
    '/api/tournaments/active',
    '/api/games/recent'
];

// Install event - cache static resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_RESOURCES))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle API requests
    if (isApiRequest(url)) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle static resources
    if (isStaticResource(url)) {
        event.respondWith(handleStaticRequest(request));
        return;
    }
    
    // Handle navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }
    
    // Default network-first strategy
    event.respondWith(
        fetch(request)
            .catch(() => caches.match(request))
    );
});

// Push event - handle notifications
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.message,
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/badge-96x96.png',
        data: data
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    const data = event.notification.data;
    let url = '/';
    
    if (data.type === 'game_update') {
        url = `/game/${data.game_id}`;
    } else if (data.type === 'tournament_update') {
        url = `/tournament/${data.tournament_id}`;
    }
    
    event.waitUntil(
        clients.openWindow(url)
    );
});

// Background sync event
self.addEventListener('sync', event => {
    if (event.tag === 'sync-game-updates') {
        event.waitUntil(syncGameUpdates());
    }
});

// Helper functions
function isApiRequest(url) {
    return url.pathname.startsWith('/api/');
}

function isStaticResource(url) {
    return url.pathname.startsWith('/static/');
}

async function handleApiRequest(request) {
    try {
        const response = await fetch(request);
        if (response.ok && API_ROUTES.some(route => request.url.includes(route))) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response(
            JSON.stringify({ error: 'Offline' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || fetch(request);
}

async function handleNavigationRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        return cache.match(OFFLINE_URL);
    }
}

async function syncGameUpdates() {
    const pendingUpdates = await getPendingUpdates();
    for (const update of pendingUpdates) {
        try {
            await sendUpdate(update);
            await markUpdateSynced(update.id);
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
}

// IndexedDB helpers for offline data
const dbName = 'dojopool-offline';
const storeName = 'pending-updates';

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        };
    });
}

async function getPendingUpdates() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function markUpdateSynced(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
} 
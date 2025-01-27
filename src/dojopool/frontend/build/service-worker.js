const CACHE_NAME = 'dojopool-v1';
const DYNAMIC_CACHE = 'dojopool-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/runtime.js',
  '/static/js/vendor.js',
  '/offline.html',
  '/screenshots/home.png',
  '/screenshots/game.png',
  '/screenshots/stats.png',
];

// API routes to cache on the fly
const API_ROUTES = [
  '/api/tournaments',
  '/api/venues',
  '/api/leaderboard',
  '/api/user/profile',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith('dojopool-') &&
                name !== CACHE_NAME &&
                name !== DYNAMIC_CACHE
            )
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static asset requests
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then((response) => {
          // Cache successful responses in dynamic cache
          if (response.ok && response.type === 'basic') {
            const responseToCache = response.clone();
            caches
              .open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return null;
        });
    })
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    console.log('Fetch failed, trying cache', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // Return offline data if available
  return new Response(
    JSON.stringify({ error: 'You are offline', offline: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: 'explore', title: 'View Details' },
      { action: 'close', title: 'Close' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('DojoPool Update', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Periodic background sync for leaderboard updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-leaderboard') {
    event.waitUntil(updateLeaderboard());
  }
});

// Helper function to sync game data
async function syncGameData() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();

  for (const request of requests) {
    if (request.url.includes('/api/game/')) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.error('Failed to sync game data:', error);
      }
    }
  }
}

// Helper function to update leaderboard
async function updateLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/api/leaderboard', response);
    }
  } catch (error) {
    console.error('Failed to update leaderboard:', error);
  }
}

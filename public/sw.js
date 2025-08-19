const CACHE_NAME = 'dojopool-v1.0.0';
const STATIC_CACHE = 'dojopool-static-v1.0.0';
const DYNAMIC_CACHE = 'dojopool-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/map',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/images/dragon.webp',
  '/images/fox.webp',
  '/images/compliance-bg.webp',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/health',
  '/api/dojo/candidates',
  '/api/player/profile',
  '/api/player/homeDojo',
  '/api/challenge/active',
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static file requests
  if (url.origin === location.origin) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle external requests (Google Maps, etc.)
  if (url.origin !== location.origin) {
    event.respondWith(handleExternalRequest(request));
    return;
  }
});

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for API request:', request.url);
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('[SW] Serving API from cache:', request.url);
    return cachedResponse;
  }

  // Return offline response for API requests
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'No internet connection available',
      cached: false,
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[SW] Serving static file from cache:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for static request:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Handle external requests with network-first strategy
async function handleExternalRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for external request:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(performBackgroundSync());
  }
});

// Perform background sync operations
async function performBackgroundSync() {
  try {
    // Sync any pending operations
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        message: 'Syncing offline operations...',
      });
    });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New DojoPool update!',
    icon: '/images/dragon.webp',
    badge: '/images/fox.webp',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore Dojo',
        icon: '/images/dragon.webp',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/fox.webp',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('DojoPool', options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/map'));
  }
});

// Handle message events from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

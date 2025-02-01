const CACHE_NAME = 'dojopool-v2';
const DYNAMIC_CACHE = 'dojopool-dynamic-v2';
const IMG_CACHE = 'dojopool-images-v1';
const API_CACHE = 'dojopool-api-v1';

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
  '/static/fonts/roboto.woff2',
  '/static/icons/sprite.svg',
  '/static/css/themes/dark.css',
  '/static/css/themes/light.css',
];

// API routes to cache on the fly
const API_ROUTES = [
  '/api/tournaments',
  '/api/venues',
  '/api/leaderboard',
  '/api/user/profile',
  '/api/game/stats',
  '/api/achievements',
  '/api/notifications'
];

// Routes that should never be cached
const NO_CACHE_ROUTES = [
  '/api/auth',
  '/api/payment',
  '/api/admin'
];

// Cache expiration times (in minutes)
const CACHE_EXPIRATION = {
  api: 15,
  dynamic: 60,
  images: 1440 // 24 hours
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(IMG_CACHE).then((cache) => {
        console.log('Caching image assets');
        return cache.addAll([
          '/static/images/placeholder.jpg',
          '/static/images/offline.jpg'
        ]);
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('dojopool-'))
            .map((name) => {
              if (
                ![CACHE_NAME, DYNAMIC_CACHE, IMG_CACHE, API_CACHE].includes(name)
              ) {
                console.log('Deleting old cache:', name);
                return caches.delete(name);
              }
            })
        );
      }),
      // Clean up expired items
      cleanExpiredCaches(),
      // Update runtime caching
      updateRuntimeCaching()
    ]).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Never cache certain routes
  if (NO_CACHE_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(fetch(request));
    return;
  }

  // Handle API requests
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
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
          if (response.ok && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
              // Add expiration metadata
              setExpirationMetadata(DYNAMIC_CACHE, request.url);
            });
          }
          return response;
        })
        .catch(() => {
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
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
      // Add expiration metadata
      setExpirationMetadata(API_CACHE, request.url);
      return response;
    }
  } catch (error) {
    console.log('Fetch failed, trying cache', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse && !isExpired(API_CACHE, request.url)) {
      return cachedResponse;
    }
  }

  // Return offline data
  return new Response(
    JSON.stringify({
      error: 'You are offline',
      offline: true,
      timestamp: Date.now()
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse && !isExpired(IMG_CACHE, request.url)) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMG_CACHE);
      cache.put(request, response.clone());
      // Add expiration metadata
      setExpirationMetadata(IMG_CACHE, request.url);
      return response;
    }
  } catch (error) {
    console.log('Image fetch failed:', error);
  }

  // Return placeholder image
  return caches.match('/static/images/placeholder.jpg');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  } else if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Push notification handling with enhanced options
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || 1,
      url: data.url || '/'
    },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'close', title: 'Close' }
    ],
    tag: data.tag || 'default',
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'DojoPool Update', options),
      updateNotificationBadge()
    ])
  );
});

// Notification click handling with enhanced navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        return clients.openWindow(urlToOpen);
      })
    );
  }
});

// Periodic background sync for various updates
self.addEventListener('periodicsync', (event) => {
  switch (event.tag) {
    case 'update-leaderboard':
      event.waitUntil(updateLeaderboard());
      break;
    case 'update-tournaments':
      event.waitUntil(updateTournaments());
      break;
    case 'update-achievements':
      event.waitUntil(updateAchievements());
      break;
  }
});

// Helper function to sync game data
async function syncGameData() {
  const cache = await caches.open(API_CACHE);
  const requests = await cache.keys();
  const gameRequests = requests.filter((request) =>
    request.url.includes('/api/game/')
  );

  return Promise.all(
    gameRequests.map(async (request) => {
      try {
        const cachedResponse = await cache.match(request);
        const data = await cachedResponse.json();
        
        const response = await fetch(request.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          await cache.delete(request);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to sync game data:', error);
        return false;
      }
    })
  );
}

// Helper function to sync user data
async function syncUserData() {
  const cache = await caches.open(API_CACHE);
  const requests = await cache.keys();
  const userRequests = requests.filter((request) =>
    request.url.includes('/api/user/')
  );

  return Promise.all(
    userRequests.map(async (request) => {
      try {
        const cachedResponse = await cache.match(request);
        const data = await cachedResponse.json();
        
        const response = await fetch(request.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          await cache.delete(request);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to sync user data:', error);
        return false;
      }
    })
  );
}

// Helper function to update leaderboard
async function updateLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put('/api/leaderboard', response);
      setExpirationMetadata(API_CACHE, '/api/leaderboard');
    }
  } catch (error) {
    console.error('Failed to update leaderboard:', error);
  }
}

// Helper function to update tournaments
async function updateTournaments() {
  try {
    const response = await fetch('/api/tournaments');
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put('/api/tournaments', response);
      setExpirationMetadata(API_CACHE, '/api/tournaments');
    }
  } catch (error) {
    console.error('Failed to update tournaments:', error);
  }
}

// Helper function to update achievements
async function updateAchievements() {
  try {
    const response = await fetch('/api/achievements');
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put('/api/achievements', response);
      setExpirationMetadata(API_CACHE, '/api/achievements');
    }
  } catch (error) {
    console.error('Failed to update achievements:', error);
  }
}

// Helper function to update notification badge
async function updateNotificationBadge() {
  if ('setAppBadge' in navigator) {
    try {
      const response = await fetch('/api/notifications/unread');
      if (response.ok) {
        const { count } = await response.json();
        navigator.setAppBadge(count);
      }
    } catch (error) {
      console.error('Failed to update notification badge:', error);
    }
  }
}

// Helper function to set cache expiration metadata
function setExpirationMetadata(cacheName, url) {
  const expirationTime = CACHE_EXPIRATION[cacheName.split('-')[1]] || 60;
  const metadata = {
    url,
    timestamp: Date.now(),
    expiresIn: expirationTime * 60 * 1000 // Convert to milliseconds
  };
  localStorage.setItem(`${cacheName}:${url}`, JSON.stringify(metadata));
}

// Helper function to check if cached item is expired
function isExpired(cacheName, url) {
  const metadata = localStorage.getItem(`${cacheName}:${url}`);
  if (!metadata) return true;

  const { timestamp, expiresIn } = JSON.parse(metadata);
  return Date.now() - timestamp > expiresIn;
}

// Helper function to clean expired cache items
async function cleanExpiredCaches() {
  const caches = [
    { name: API_CACHE, type: 'api' },
    { name: DYNAMIC_CACHE, type: 'dynamic' },
    { name: IMG_CACHE, type: 'images' }
  ];

  return Promise.all(
    caches.map(async ({ name, type }) => {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      
      return Promise.all(
        requests.map(async (request) => {
          if (isExpired(name, request.url)) {
            await cache.delete(request);
            localStorage.removeItem(`${name}:${request.url}`);
          }
        })
      );
    })
  );
}

// Helper function to update runtime caching
async function updateRuntimeCaching() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();

  return Promise.all(
    requests.map(async (request) => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
          setExpirationMetadata(DYNAMIC_CACHE, request.url);
        }
      } catch (error) {
        console.error('Failed to update runtime cache:', error);
      }
    })
  );
}

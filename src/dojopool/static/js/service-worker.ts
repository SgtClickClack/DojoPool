/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

interface GameAction {
  id: string;
  type: string;
  data: any;
}

interface DB {
  pendingActions: IDBObjectStore;
}

const CACHE_NAME = 'dojo-pool-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
];

const API_ROUTES = ['/api/v1/venues', '/api/v1/tournaments'];

async function getPendingActions(): Promise<GameAction[]> {
  const db = await openDB();
  const store = db
    .transaction('pendingActions', 'readonly')
    .objectStore('pendingActions');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingAction(actionId: string): Promise<void> {
  const db = await openDB();
  const store = db
    .transaction('pendingActions', 'readwrite')
    .objectStore('pendingActions');
  return new Promise((resolve, reject) => {
    const request = store.delete(actionId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
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

self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((response) => {
          if (API_ROUTES.some((route) => event.request.url.includes(route))) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
      );
    })
  );
});

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-games') {
    event.waitUntil(syncPendingActions());
  }
});

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/static/images/icons/icon-192x192.png',
    badge: '/static/images/icons/badge-72x72.png',
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = '/';
  event.waitUntil(self.clients.openWindow(url));
});

async function syncPendingActions(): Promise<void> {
  const actions = await getPendingActions();
  const results = await Promise.all(
    actions.map(async (action) => {
      try {
        const response = await fetch('/api/v1/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action),
        });

        if (response.ok) {
          await removePendingAction(action.id);
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    })
  );

  return Promise.resolve();
}

async function openDB(): Promise<DB> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gameActions', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id' });
      }
    };
  });
}

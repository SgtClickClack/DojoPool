// Service Worker for DojoPool PWA

const CACHE_NAME = "dojopool-v1";
const STATIC_CACHE = "dojopool-static-v1";
const DYNAMIC_CACHE = "dojopool-dynamic-v1";
const API_CACHE = "dojopool-api-v1";

// Resources to cache immediately
const STATIC_ASSETS = [
  "/",
  "/static/css/main.css",
  "/static/js/main.js",
  "/static/js/app.js",
  "/static/manifest.json",
  "/static/icons/favicon.ico",
  "/static/icons/icon-72x72.png",
  "/static/icons/icon-96x96.png",
  "/static/icons/icon-128x128.png",
  "/static/icons/icon-144x144.png",
  "/static/icons/icon-152x152.png",
  "/static/icons/icon-192x192.png",
  "/static/icons/icon-384x384.png",
  "/static/icons/icon-512x512.png",
  "/offline.html",
];

// API routes to cache
const API_ROUTES = [
  "/api/user/profile",
  "/api/games/recent",
  "/api/venues/nearby",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache API responses
      caches.open(API_CACHE).then((cache) => {
        console.log("Caching API routes");
        return Promise.all(
          API_ROUTES.map((route) =>
            fetch(route)
              .then((response) => cache.put(route, response))
              .catch((error) =>
                console.log(`Failed to cache ${route}:`, error),
              ),
          ),
        );
      }),
    ]),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("dojopool-"))
          .filter(
            (name) =>
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== API_CACHE,
          )
          .map((name) => caches.delete(name)),
      );
    }),
  );
});

// Fetch event - handle requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache
          const clonedResponse = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline JSON response
            return new Response(
              JSON.stringify({
                error: "offline",
                message: "No internet connection",
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            );
          });
        }),
    );
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request);
      }),
    );
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses in dynamic cache
        const clonedResponse = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, clonedResponse);
        });
        return response;
      })
      .catch(() => {
        // Return cached response or offline page
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match("/offline.html");
        });
      }),
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-game-actions") {
    event.waitUntil(
      // Get pending actions from IndexedDB
      getPendingActions().then((actions) => {
        return Promise.all(
          actions.map((action) => {
            return fetch("/api/games/action", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(action),
            })
              .then(() => removePendingAction(action.id))
              .catch((error) => console.log("Sync failed:", error));
          }),
        );
      }),
    );
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data.json();

  const options = {
    body: data.message,
    icon: "/static/icons/icon-192x192.png",
    badge: "/static/icons/badge.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
    },
    actions: [
      {
        action: "view",
        title: "View",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view") {
    const url = event.notification.data.url;
    event.waitUntil(clients.openWindow(url));
  }
});

// Helper functions
async function getPendingActions() {
  // Implementation would use IndexedDB to get pending actions
  return [];
}

async function removePendingAction(actionId) {
  // Implementation would remove action from IndexedDB
}

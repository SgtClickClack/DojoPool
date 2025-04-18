// Initialize IndexedDB
const db = new DojoPoolDB();

// Initialize sync manager
const syncManager = new SyncManager(db);

// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/static/js/service-worker.js")
      .then((registration) => {
        console.log("ServiceWorker registration successful");

        // Request notification permission
        if ("Notification" in window) {
          Notification.requestPermission();
        }

        // Setup periodic sync if available
        if ("periodicSync" in registration) {
          const syncTag = "sync-games";
          registration.periodicSync
            .register(syncTag, {
              minInterval: 24 * 60 * 60 * 1000, // 24 hours
            })
            .catch((error) => {
              console.error("Periodic sync could not be registered:", error);
            });
        }
      })
      .catch((error) => {
        console.error("ServiceWorker registration failed:", error);
      });
  });
}

// PWA Install Prompt
let deferredPrompt;
const installButton = document.getElementById("install-button");

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show the install button
  if (installButton) {
    installButton.style.display = "block";
  }
});

if (installButton) {
  installButton.addEventListener("click", async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // Clear the saved prompt since it can't be used again
      deferredPrompt = null;
      // Hide the install button
      installButton.style.display = "none";
    }
  });
}

// Handle app installed event
window.addEventListener("appinstalled", () => {
  console.log("PWA was installed");
  // Hide the install button
  if (installButton) {
    installButton.style.display = "none";
  }
});

// Network status handling
function updateOnlineStatus() {
  const status = navigator.onLine ? "online" : "offline";
  document.body.dataset.connectionStatus = status;

  // Update UI elements that depend on connection status
  const offlineIndicator = document.getElementById("offline-indicator");
  if (offlineIndicator) {
    offlineIndicator.style.display = status === "offline" ? "block" : "none";
  }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus(); // Initial check

// Background sync handling
async function syncData() {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register("sync-games");
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Periodic data refresh
let refreshInterval;

function startPeriodicRefresh() {
  if (navigator.onLine) {
    refreshInterval = setInterval(
      async () => {
        if (navigator.onLine) {
          await syncData();
        }
      },
      5 * 60 * 1000,
    ); // Refresh every 5 minutes
  }
}

function stopPeriodicRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

window.addEventListener("online", startPeriodicRefresh);
window.addEventListener("offline", stopPeriodicRefresh);

// Start refresh if online
if (navigator.onLine) {
  startPeriodicRefresh();
}

// Export instances for use in other modules
export { db, syncManager, syncData, updateOnlineStatus };

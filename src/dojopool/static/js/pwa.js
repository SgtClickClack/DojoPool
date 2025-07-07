/**
 * PWA initialization and management
 */

import { safeSetInnerHTML } from '../utils/securityUtils.js';

class NotificationHandler {
  constructor(userId, token) {
    this.userId = userId;
    this.token = token;
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.unreadCount = 0;
    this.notifications = [];
  }

  async connect() {
    try {
      this.socket = io("http://localhost:5000", {
        auth: {
          user_id: this.userId,
          token: this.token,
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on("connect", () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.updateUI();
      });

      this.socket.on("message", (data) => {
        this.handleMessage(data);
      });

      this.socket.on("disconnect", () => {
        this.connected = false;
        this.handleDisconnect();
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
        this.connected = false;
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      this.handleDisconnect();
    }
  }

  handleMessage(data) {
    try {
      if (data.type === "notification") {
        this.notifications.unshift(data.payload);
        this.unreadCount++;
        this.updateUI();
        this.showNotification(data.payload);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  handleDisconnect() {
    if (!this.connected && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  updateUI() {
    // Update notification badge
    const badge = document.getElementById("notification-badge");
    if (badge) {
      badge.textContent = this.unreadCount;
      badge.style.display = this.unreadCount > 0 ? "block" : "none";
    }

    // Update notification list
    const list = document.getElementById("notification-list");
    if (list) {
      const notificationsHTML = this.notifications
        .map(
          (notification) => `
                    <div class="notification-item">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <small>${new Date(notification.timestamp).toLocaleString()}</small>
                    </div>
                `,
        )
        .join("");
      safeSetInnerHTML(list, notificationsHTML);
    }

    // Update connection status
    const status = document.getElementById("connection-status");
    if (status) {
      status.textContent = this.connected ? "Connected" : "Disconnected";
      status.className = this.connected
        ? "status-connected"
        : "status-disconnected";
    }
  }

  async showNotification(notification) {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/static/images/logo.png",
      });
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        this.showNotification(notification);
      }
    }
  }

  markAsRead(notificationId) {
    const index = this.notifications.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      this.notifications[index].read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.updateUI();
    }
  }

  markAllAsRead() {
    this.notifications.forEach((notification) => {
      notification.read = true;
    });
    this.unreadCount = 0;
    this.updateUI();
  }

  clearNotifications() {
    this.notifications = [];
    this.unreadCount = 0;
    this.updateUI();
  }
}

class PWAManager {
  constructor() {
    this.swRegistration = null;
    this.isSubscribed = false;
    this.notificationHandler = null;

    // Bind methods
    this.init = this.init.bind(this);
    this.registerServiceWorker = this.registerServiceWorker.bind(this);
    this.subscribeUser = this.subscribeUser.bind(this);
    this.updateSubscriptionOnServer =
      this.updateSubscriptionOnServer.bind(this);
    this.urlBase64ToUint8Array = this.urlBase64ToUint8Array.bind(this);
    this.initializeNotifications();
  }

  /**
   * Initialize PWA functionality
   */
  async init() {
    // Check if service workers are supported
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        this.registerServiceWorker();
        this.initPushNotifications();
        this.initInstallPrompt();
        this.initConnectivityCheck();
        this.notificationHandler.connect(); // Connect to WebSocket server
      });
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register(
        "/static/js/service-worker.js",
      );
      console.log(
        "ServiceWorker registration successful with scope:",
        registration.scope,
      );

      // Set up background sync
      if ("sync" in registration) {
        this.setupBackgroundSync(registration);
      }
    } catch (err) {
      console.error("ServiceWorker registration failed:", err);
    }
  }

  /**
   * Initialize push notifications
   */
  async initPushNotifications() {
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(
              "YOUR_VAPID_PUBLIC_KEY", // Replace with your VAPID public key
            ),
          });
          // Send subscription to server
          await fetch("/api/push-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(subscription),
          });
        }
      }
    } catch (err) {
      console.error("Error initializing push notifications:", err);
    }
  }

  /**
   * Initialize install prompt
   */
  initInstallPrompt() {
    let deferredPrompt;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener("appinstalled", () => {
      this.hideInstallButton();
      deferredPrompt = null;
      // Send analytics
      if (typeof gtag === "function") {
        gtag("event", "pwa_install");
      }
    });
  }

  /**
   * Show install button
   */
  showInstallButton() {
    const installButton = document.getElementById("installButton");
    if (installButton) {
      installButton.style.display = "block";
      installButton.addEventListener("click", async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to install prompt: ${outcome}`);
          deferredPrompt = null;
        }
      });
    }
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    const installButton = document.getElementById("installButton");
    if (installButton) {
      installButton.style.display = "none";
    }
  }

  /**
   * Initialize connectivity check
   */
  initConnectivityCheck() {
    const updateOnlineStatus = () => {
      const condition = navigator.onLine ? "online" : "offline";
      document.body.dataset.connectionStatus = condition;

      const statusBar = document.getElementById("connectionStatus");
      if (statusBar) {
        statusBar.textContent = condition.toUpperCase();
        statusBar.className = condition;
      }

      // Send analytics
      if (typeof gtag === "function") {
        gtag("event", "connectivity_change", {
          event_category: "System",
          event_label: condition,
        });
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
  }

  /**
   * Set up background sync
   */
  setupBackgroundSync(registration) {
    document.addEventListener("submit", async (e) => {
      if (e.target.dataset.offline === "sync") {
        e.preventDefault();

        if (!navigator.onLine) {
          try {
            const formData = new FormData(e.target);
            const payload = Object.fromEntries(formData.entries());
            await this.storeFormData({
              id: Date.now().toString(),
              url: e.target.action,
              payload,
            });
            await registration.sync.register("sync-forms");
            this.showMessage("Form will be submitted when you're back online");
          } catch (err) {
            console.error("Error setting up background sync:", err);
            this.showMessage("Error saving form data for offline submission");
          }
        }
      }
    });
  }

  /**
   * Store form data in IndexedDB
   */
  storeFormData(data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("DojoPoolDB", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("forms", "readwrite");
        const store = tx.objectStore("forms");
        store.add(data).onsuccess = () => resolve();
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("forms")) {
          db.createObjectStore("forms", { keyPath: "id" });
        }
      };
    });
  }

  /**
   * Show message to user
   */
  showMessage(message, type = "info") {
    const messageContainer = document.getElementById("messageContainer");
    if (messageContainer) {
      const messageElement = document.createElement("div");
      messageElement.className = `message ${type}`;
      messageElement.textContent = message;
      messageContainer.appendChild(messageElement);
      setTimeout(() => messageElement.remove(), 5000);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async initializeNotifications() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Get user data from the page
        const userId = document.getElementById("user-id")?.value;
        const token = document.getElementById("user-token")?.value;

        if (userId && token) {
          this.notificationHandler = new NotificationHandler(userId, token);
          await this.notificationHandler.connect();
        }
      }
    }
  }
}

// Initialize PWA
const pwa = new PWAManager();
pwa.init();

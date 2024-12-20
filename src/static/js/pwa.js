/**
 * PWA initialization and management
 */

class PWAManager {
    constructor() {
        this.swRegistration = null;
        this.isSubscribed = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.registerServiceWorker = this.registerServiceWorker.bind(this);
        this.subscribeUser = this.subscribeUser.bind(this);
        this.updateSubscriptionOnServer = this.updateSubscriptionOnServer.bind(this);
        this.urlBase64ToUint8Array = this.urlBase64ToUint8Array.bind(this);
    }
    
    /**
     * Initialize PWA functionality
     */
    async init() {
        // Check if service workers are supported
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                this.swRegistration = await this.registerServiceWorker();
                await this.initializePushNotifications();
                this.setupInstallPrompt();
                this.setupOfflineDetection();
                this.setupBackgroundSync();
            } catch (error) {
                console.error('Error initializing PWA:', error);
            }
        }
    }
    
    /**
     * Register service worker
     */
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/static/js/service-worker.js');
            console.log('ServiceWorker registered:', registration);
            return registration;
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize push notifications
     */
    async initializePushNotifications() {
        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            this.isSubscribed = !!subscription;
            
            if (this.isSubscribed) {
                console.log('User is subscribed to push notifications');
            } else {
                await this.subscribeUser();
            }
        } catch (error) {
            console.error('Error initializing push notifications:', error);
        }
    }
    
    /**
     * Subscribe user to push notifications
     */
    async subscribeUser() {
        try {
            const response = await fetch('/api/notifications/vapid-public-key');
            const vapidPublicKey = await response.text();
            const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);
            
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
            
            console.log('User is subscribed:', subscription);
            this.isSubscribed = true;
            
            await this.updateSubscriptionOnServer(subscription);
        } catch (error) {
            console.error('Failed to subscribe user:', error);
        }
    }
    
    /**
     * Update subscription on server
     */
    async updateSubscriptionOnServer(subscription) {
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update subscription on server');
            }
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    }
    
    /**
     * Set up install prompt
     */
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            const installButton = document.getElementById('install-button');
            if (installButton) {
                installButton.style.display = 'block';
                
                installButton.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log(`User ${outcome} the A2HS prompt`);
                        deferredPrompt = null;
                        installButton.style.display = 'none';
                    }
                });
            }
        });
    }
    
    /**
     * Set up offline detection
     */
    setupOfflineDetection() {
        window.addEventListener('online', this.handleOnlineStatus);
        window.addEventListener('offline', this.handleOnlineStatus);
        this.handleOnlineStatus();
    }
    
    /**
     * Handle online status changes
     */
    handleOnlineStatus() {
        const offlineIndicator = document.getElementById('offline-indicator');
        if (offlineIndicator) {
            offlineIndicator.style.display = navigator.onLine ? 'none' : 'block';
        }
        
        if (!navigator.onLine) {
            this.showOfflineNotification();
        }
    }
    
    /**
     * Show offline notification
     */
    showOfflineNotification() {
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.innerHTML = `
            <div class="offline-notification-content">
                <span>You're offline</span>
                <button onclick="this.parentElement.remove()">Dismiss</button>
            </div>
        `;
        document.body.appendChild(notification);
    }
    
    /**
     * Set up background sync
     */
    setupBackgroundSync() {
        if ('sync' in this.swRegistration) {
            // Register sync event
            navigator.serviceWorker.ready.then(registration => {
                document.addEventListener('gameUpdate', () => {
                    registration.sync.register('sync-game-updates');
                });
            });
        }
    }
    
    /**
     * Convert VAPID key to Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Initialize PWA
const pwa = new PWAManager();
pwa.init(); 
/**
 * Notification handler for real-time notifications
 */

class NotificationHandler {
    constructor() {
        this.socket = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.callbacks = new Map();
        
        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.handleNotification = this.handleNotification.bind(this);
        this.handleGameUpdate = this.handleGameUpdate.bind(this);
        this.handleTournamentUpdate = this.handleTournamentUpdate.bind(this);
    }
    
    /**
     * Initialize the notification handler
     */
    init() {
        this.socket = io();
        
        // Set up event listeners
        this.socket.on('connect', () => {
            console.log('Connected to notification server');
            this.updateConnectionStatus(true);
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from notification server');
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('notification', this.handleNotification);
        this.socket.on('game_update', this.handleGameUpdate);
        this.socket.on('tournament_update', this.handleTournamentUpdate);
        
        // Load existing notifications
        this.loadNotifications();
        
        // Set up UI refresh interval
        setInterval(() => this.refreshNotificationTimes(), 60000);
    }
    
    /**
     * Connect to notification server
     */
    connect() {
        if (this.socket) {
            this.socket.connect();
        }
    }
    
    /**
     * Disconnect from notification server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
    
    /**
     * Handle incoming notifications
     * @param {Object} notification - The notification data
     */
    handleNotification(notification) {
        this.notifications.unshift(notification);
        this.unreadCount++;
        
        // Update UI
        this.updateNotificationBadge();
        this.showNotificationToast(notification);
        
        // Trigger callbacks
        if (this.callbacks.has(notification.type)) {
            this.callbacks.get(notification.type)(notification);
        }
    }
    
    /**
     * Handle game updates
     * @param {Object} update - The game update data
     */
    handleGameUpdate(update) {
        // Update game UI if on game page
        const gameContainer = document.getElementById(`game-${update.game_id}`);
        if (gameContainer) {
            this.updateGameUI(gameContainer, update);
        }
        
        // Show notification
        this.showNotificationToast({
            title: 'Game Update',
            message: this.formatGameUpdate(update)
        });
    }
    
    /**
     * Handle tournament updates
     * @param {Object} update - The tournament update data
     */
    handleTournamentUpdate(update) {
        // Update tournament UI if on tournament page
        const tournamentContainer = document.getElementById(`tournament-${update.tournament_id}`);
        if (tournamentContainer) {
            this.updateTournamentUI(tournamentContainer, update);
        }
        
        // Show notification
        this.showNotificationToast({
            title: 'Tournament Update',
            message: this.formatTournamentUpdate(update)
        });
    }
    
    /**
     * Load existing notifications from server
     */
    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();
            
            this.notifications = data.notifications;
            this.unreadCount = data.unread_count;
            this.updateNotificationBadge();
            this.renderNotificationList();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }
    
    /**
     * Mark a notification as read
     * @param {number} notificationId - The notification ID
     */
    async markAsRead(notificationId) {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST'
            });
            
            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.is_read) {
                notification.is_read = true;
                this.unreadCount--;
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
    
    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            await fetch('/api/notifications/mark-all-read', {
                method: 'POST'
            });
            
            // Update local state
            this.notifications.forEach(n => n.is_read = true);
            this.unreadCount = 0;
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }
    
    /**
     * Update the notification badge count
     */
    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }
    }
    
    /**
     * Show a notification toast
     * @param {Object} notification - The notification to display
     */
    showNotificationToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
    
    /**
     * Register a callback for specific notification types
     * @param {string} type - The notification type
     * @param {Function} callback - The callback function
     */
    onNotification(type, callback) {
        this.callbacks.set(type, callback);
    }
    
    /**
     * Format relative time for notifications
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted relative time
     */
    formatRelativeTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }
    
    /**
     * Refresh notification timestamps
     */
    refreshNotificationTimes() {
        const timestamps = document.querySelectorAll('.notification-time');
        timestamps.forEach(el => {
            const timestamp = el.getAttribute('data-time');
            el.textContent = this.formatRelativeTime(timestamp);
        });
    }
} 
class NotificationManager {
  constructor() {
    this.container = this.createContainer();
    this.notifications = new Map();
    this.setupEventListeners();
  }

  createContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
    document.body.appendChild(container);
    return container;
  }

  setupEventListeners() {
    // Listen for sync notifications
    window.addEventListener('sync-notification', (event) => {
      this.show(event.detail.type, event.detail.message);
    });

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.show('success', 'You are back online');
    });

    window.addEventListener('offline', () => {
      this.show('warning', 'You are offline. Changes will be saved locally.');
    });
  }

  show(type, message, duration = 5000) {
    const notification = this.createNotification(type, message);
    const id = Date.now().toString();

    this.notifications.set(id, notification);
    this.container.appendChild(notification);

    // Auto-dismiss after duration
    setTimeout(() => this.dismiss(id), duration);

    return id;
  }

  dismiss(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
        this.notifications.delete(id);
      }, 300);
    }
  }

  createNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
            padding: 12px 24px;
            border-radius: 4px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            animation: slide-in 0.3s ease-out;
            min-width: 300px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: opacity 0.3s ease-out;
        `;

    // Set background color based on type
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#4caf50';
        break;
      case 'error':
        notification.style.backgroundColor = '#f44336';
        break;
      case 'warning':
        notification.style.backgroundColor = '#ff9800';
        break;
      default:
        notification.style.backgroundColor = '#2196f3';
    }

    // Add message
    const messageElement = document.createElement('span');
    messageElement.textContent = message;
    notification.appendChild(messageElement);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            margin: 0;
            line-height: 1;
        `;
    closeButton.addEventListener('click', () => {
      this.dismiss(
        Array.from(this.notifications.entries()).find(
          ([, n]) => n === notification
        )?.[0]
      );
    });
    notification.appendChild(closeButton);

    return notification;
  }

  // Add styles to document
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
            @keyframes slide-in {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .notification.fade-out {
                opacity: 0;
            }

            .notification:hover {
                opacity: 0.95;
            }
        `;
    document.head.appendChild(style);
  }
}

// Initialize notification manager
const notificationManager = new NotificationManager();
notificationManager.addStyles();

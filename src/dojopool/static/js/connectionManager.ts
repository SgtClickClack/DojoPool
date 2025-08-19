// Generated type definitions

class ConnectionManager {
  // Properties and methods
}

interface connectionManager {
  // Properties
}

// Type imports

export class ConnectionManager {
  constructor() {
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000; // Start with 1 second
    this.maxDelay = 30000; // Max 30 seconds
    this.state = {
      lastOnlineTime: Date.now(),
      pendingOperations: new Map(),
      networkQuality: 'high',
      isRecovering: false,
    };

    this.initializeNetworkHandling();
  }

  initializeNetworkHandling() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Monitor connection quality changes
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () =>
        this.handleConnectionChange()
      );
    }
  }

  handleOnline() {
    this.state.isRecovering = true;
    this.retryPendingOperations()
      .then(() => {
        this.state.lastOnlineTime = Date.now();
        this.state.isRecovering = false;
        this.resetRetryCount();
        this.dispatchEvent('connectionRecovered');
      })
      .catch((error) => {
        console.error('Recovery failed:', error);
        this.scheduleRetry();
      });
  }

  handleOffline() {
    this.state.lastOnlineTime = Date.now();
    this.dispatchEvent('connectionLost');
  }

  handleConnectionChange() {
    const connection: any = navigator.connection;
    const prevQuality: any = this.state.networkQuality;

    // Determine network quality based on connection type and speed
    if (connection.effectiveType === '4g' && connection.downlink >= 5) {
      this.state.networkQuality = 'high';
    } else if (
      connection.effectiveType === '4g' ||
      connection.effectiveType === '3g'
    ) {
      this.state.networkQuality = 'medium';
    } else {
      this.state.networkQuality = 'low';
    }

    if (prevQuality !== this.state.networkQuality) {
      this.dispatchEvent('qualityChange', {
        from: prevQuality,
        to: this.state.networkQuality,
      });
    }
  }

  async retryPendingOperations() {
    for (const [id, operation] of this.state.pendingOperations) {
      try {
        await operation.retry();
        this.state.pendingOperations.delete(id);
      } catch (error) {
        console.warn(`Failed to retry operation ${id}:`, error);
      }
    }
  }

  scheduleRetry() {
    if (this.retryAttempts >= this.maxRetries) {
      this.dispatchEvent('recoveryFailed');
      return;
    }

    const delay: any = Math.min(
      this.retryDelay * Math.pow(2, this.retryAttempts),
      this.maxDelay
    );
    setTimeout(() => this.handleOnline(), delay);
    this.retryAttempts++;
  }

  resetRetryCount() {
    this.retryAttempts = 0;
  }

  addPendingOperation(id, operation) {
    this.state.pendingOperations.set(id, operation);
  }

  removePendingOperation(id) {
    this.state.pendingOperations.delete(id);
  }

  dispatchEvent(type, detail = {}) {
    const event: any = new CustomEvent(`connection:${type}`, { detail });
    window.dispatchEvent(event);
  }

  getState() {
    return {
      ...this.state,
      pendingOperationsCount: this.state.pendingOperations.size,
    };
  }
}

export const connectionManager: any = new ConnectionManager();

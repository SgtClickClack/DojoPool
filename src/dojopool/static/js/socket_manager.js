// Socket.IO Connection Manager with Enhanced Reconnection and Webview Support
class SocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 15;
        this.baseDelay = 1000; // Start with 1 second delay
        this.maxDelay = 30000; // Max delay of 30 seconds
        this.connectionState = {
            isConnected: false,
            lastEventTime: null,
            userId: null,
            pendingMessages: [],
            lastReconnectAttempt: null,
            state: 'initializing',
            isWebview: false
        };
        this.healthCheckInterval = null;
        this.initialize();
    }

    initialize() {
        // Initialize Socket.IO with enhanced reconnection options and webview support
        const protocol = window.location.protocol;
        const isWebview = window.location.hostname.includes('.webview');
        this.connectionState.isWebview = isWebview;
        
        this.socket = io({
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.baseDelay,
            reconnectionDelayMax: this.maxDelay,
            timeout: isWebview ? 120000 : 60000, // Longer timeout for webview
            autoConnect: true,
            transports: ['websocket', 'polling'],
            // Add randomization to prevent thundering herd
            randomizationFactor: 0.5,
            // Ensure proper protocol and origin handling
            secure: protocol === 'https:',
            rejectUnauthorized: false,
            withCredentials: true,
            extraHeaders: {
                'X-Client-Type': isWebview ? 'webview' : 'browser'
            }
        });

        this.setupEventHandlers();
        this.startHealthCheck();
        
        // Enhanced webview support
        if (isWebview) {
            this.setupWebviewHandlers();
        }
    }

    setupWebviewHandlers() {
        // Handle webview-specific events
        window.addEventListener('focus', () => {
            if (!this.connectionState.isConnected) {
                console.log('Webview gained focus, attempting reconnection...');
                this.forceReconnect();
            }
        });

        window.addEventListener('online', () => {
            console.log('Network connection restored in webview');
            if (!this.connectionState.isConnected) {
                this.forceReconnect();
            }
        });

        // Handle webview suspension/resume
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !this.connectionState.isConnected) {
                console.log('Webview became visible, checking connection...');
                this.checkConnectionState();
            }
        });
    }

    setupEventHandlers() {
        // Connection event handlers with enhanced state management
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connectionState.isConnected = true;
            this.connectionState.state = 'connected';
            this.reconnectAttempts = 0;
            this.connectionState.lastEventTime = Date.now();
            
            // Clear any error states
            this.clearErrorState();
            
            // Attempt to restore session state
            this.restoreState();
            
            // Show connection status to user
            this.updateUIStatus('Connected', 'success');
            
            // Process any pending messages
            this.processPendingMessages();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
            this.connectionState.isConnected = false;
            this.connectionState.state = 'disconnected';
            this.connectionState.lastEventTime = Date.now();
            
            // Save state before attempting reconnection
            this.saveState();
            
            // Handle different disconnect reasons
            const messages = {
                'io server disconnect': 'Server disconnected - Attempting to reconnect...',
                'io client disconnect': 'Client disconnected - Attempting to reconnect...',
                'transport close': 'Connection lost - Attempting to reconnect...',
                'ping timeout': 'Connection timeout - Attempting to reconnect...'
            };
            
            const message = messages[reason] || 'Connection lost - Attempting to reconnect...';
            this.updateUIStatus(message, 'warning');
            
            // Handle webview-specific reconnection
            if (this.connectionState.isWebview) {
                // Use longer delays for webview reconnection
                setTimeout(() => this.forceReconnect(), 2000);
            } else if (['transport close', 'ping timeout'].includes(reason)) {
                setTimeout(() => this.forceReconnect(), 1000);
            }
        });

        // Enhanced reconnection handling with exponential backoff
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}`);
            this.reconnectAttempts = attemptNumber;
            this.connectionState.lastReconnectAttempt = Date.now();
            this.connectionState.state = 'reconnecting';
            
            // Calculate delay using exponential backoff with jitter
            const jitter = Math.random() * 0.3 + 0.85; // Random factor between 0.85 and 1.15
            const delay = Math.min(
                this.baseDelay * Math.pow(1.5, attemptNumber - 1) * jitter,
                this.maxDelay
            );
            
            this.updateUIStatus(
                `Reconnecting in ${(delay/1000).toFixed(1)} seconds... (Attempt ${attemptNumber}/${this.maxReconnectAttempts})`,
                'warning'
            );
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            this.connectionState.isConnected = true;
            this.connectionState.state = 'connected';
            this.connectionState.lastEventTime = Date.now();
            
            // Restore connection state
            this.restoreState();
            this.updateUIStatus('Reconnected successfully', 'success');
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('Reconnection error:', error);
            this.connectionState.state = 'error';
            this.updateUIStatus(`Reconnection failed: ${error.message}`, 'error');
            
            // Special handling for webview
            if (this.connectionState.isWebview) {
                this.handleWebviewReconnectionError();
            }
        });

        this.socket.on('reconnect_failed', () => {
            console.log('Failed to reconnect after maximum attempts');
            this.connectionState.state = 'failed';
            
            if (this.connectionState.isWebview) {
                this.updateUIStatus('Connection failed - Retrying in background...', 'error');
                setTimeout(() => this.forceReconnect(), 5000);
            } else {
                this.updateUIStatus('Connection failed - Please refresh the page', 'error');
                this.handleReconnectionFailure();
            }
        });

        // Enhanced error handling with specific error types
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.connectionState.state = 'error';
            this.handleSocketError(error);
        });

        // Server responses
        this.socket.on('pong', (data) => {
            this.connectionState.lastEventTime = Date.now();
            if (data && data.timestamp) {
                this.connectionState.lastServerTimestamp = data.timestamp;
            }
        });

        // Connection confirmation with enhanced state management
        this.socket.on('connection_confirmed', (data) => {
            console.log('Connection confirmed:', data);
            this.connectionState.userId = data.sid;
            this.connectionState.lastEventTime = Date.now();
            this.connectionState.isWebview = data.is_webview;
            
            if (data.session_restored) {
                console.log('Session restored successfully');
            }
            
            if (data.user_id) {
                this.connectionState.userId = data.user_id;
            }
        });
    }

    handleWebviewReconnectionError() {
        // Implement progressive backoff for webview reconnection
        const backoffDelay = Math.min(
            this.baseDelay * Math.pow(2, this.reconnectAttempts),
            this.maxDelay
        );
        
        setTimeout(() => {
            if (!this.connectionState.isConnected) {
                this.forceReconnect();
            }
        }, backoffDelay);
    }

    checkConnectionState() {
        if (!this.connectionState.isConnected) {
            console.log('Connection check failed, attempting reconnect...');
            this.forceReconnect();
        } else {
            this.ping();
        }
    }

    startHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        const interval = this.connectionState.isWebview ? 60000 : 30000;
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, interval);
    }

    performHealthCheck() {
        if (!this.connectionState.isConnected) {
            return;
        }

        const now = Date.now();
        const lastEventAge = now - this.connectionState.lastEventTime;
        const maxAge = this.connectionState.isWebview ? 90000 : 45000;

        if (lastEventAge > maxAge) {
            console.log('Connection appears stale, attempting to reconnect...');
            this.forceReconnect();
        } else {
            this.ping();
        }
    }

    handleSocketError(error) {
        const errorMessage = error.message || 'Unknown error occurred';
        this.updateUIStatus(`Connection error: ${errorMessage}`, 'error');
        
        this.connectionState.lastError = {
            timestamp: Date.now(),
            message: errorMessage
        };

        if (error.type === 'TransportError') {
            setTimeout(() => this.forceReconnect(), 1000);
        }
    }

    handleReconnectionFailure() {
        if (this.socket) {
            this.socket.close();
        }

        if (!this.connectionState.isWebview) {
            this.showRefreshButton();
        }
    }

    showRefreshButton() {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            const refreshButton = document.createElement('button');
            refreshButton.textContent = 'Refresh Page';
            refreshButton.className = 'btn btn-primary mt-2';
            refreshButton.onclick = () => window.location.reload();
            statusElement.appendChild(refreshButton);
        }
    }

    clearErrorState() {
        if (this.connectionState.lastError) {
            delete this.connectionState.lastError;
        }
        
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            const refreshButton = statusElement.querySelector('button');
            if (refreshButton) {
                refreshButton.remove();
            }
        }
    }

    ping() {
        if (this.connectionState.isConnected) {
            const pingTimeout = setTimeout(() => {
                console.log('Ping timeout, connection might be unstable');
                this.updateUIStatus('Connection unstable', 'warning');
            }, 5000);

            this.socket.emit('ping', () => {
                clearTimeout(pingTimeout);
            });
        }
    }

    saveState() {
        const state = {
            userId: this.connectionState.userId,
            lastEventTime: this.connectionState.lastEventTime,
            pendingMessages: this.connectionState.pendingMessages,
            sessionData: sessionStorage.getItem('socketSession'),
            state: this.connectionState.state,
            isWebview: this.connectionState.isWebview
        };
        
        localStorage.setItem('socketState', JSON.stringify(state));
        console.log('Connection state saved');
    }

    restoreState() {
        try {
            const savedState = JSON.parse(localStorage.getItem('socketState'));
            if (savedState) {
                this.connectionState.userId = savedState.userId;
                this.connectionState.lastEventTime = savedState.lastEventTime;
                this.connectionState.pendingMessages = savedState.pendingMessages || [];
                this.connectionState.state = savedState.state || 'connected';
                this.connectionState.isWebview = savedState.isWebview;

                if (savedState.sessionData) {
                    sessionStorage.setItem('socketSession', savedState.sessionData);
                }

                console.log('Connection state restored');
                return true;
            }
        } catch (error) {
            console.error('Error restoring state:', error);
        }
        return false;
    }

    processPendingMessages() {
        const messages = [...this.connectionState.pendingMessages];
        this.connectionState.pendingMessages = [];

        messages.forEach(message => {
            console.log('Processing pending message:', message.event);
            this.socket.emit(message.event, message.data);
        });
    }

    queueMessage(event, data) {
        if (!this.connectionState.isConnected) {
            console.log('Queuing message for later delivery:', event);
            this.connectionState.pendingMessages.push({ event, data });
            return false;
        }
        return true;
    }

    sendMessage(event, data) {
        if (this.queueMessage(event, data)) {
            this.socket.emit(event, data);
            console.log('Message sent:', event);
        }
    }

    updateUIStatus(message, type) {
        let statusElement = document.getElementById('connection-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'connection-status';
            statusElement.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 1000;
                transition: all 0.3s ease;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(statusElement);
        }

        const styles = {
            success: 'background-color: var(--bs-success); color: white;',
            warning: 'background-color: var(--bs-warning); color: black;',
            error: 'background-color: var(--bs-danger); color: white;'
        };

        statusElement.style.cssText += styles[type] || styles.warning;
        statusElement.textContent = message;

        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.opacity = '0';
                setTimeout(() => {
                    if (statusElement.style.opacity === '0') {
                        statusElement.style.display = 'none';
                    }
                }, 300);
            }, 3000);
        } else {
            statusElement.style.opacity = '1';
            statusElement.style.display = 'block';
        }
    }

    forceReconnect() {
        if (!this.connectionState.isConnected) {
            if (this.socket) {
                this.socket.close();
            }
            
            setTimeout(() => {
                console.log('Forcing reconnection...');
                this.socket.connect();
            }, 1000);
        }
    }

    disconnect() {
        this.saveState();
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.socket.disconnect();
    }
}

// Create global socket manager instance
const socketManager = new SocketManager();

// Export for use in other modules
window.socketManager = socketManager;

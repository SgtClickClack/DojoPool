class NetworkStatus {
    constructor() {
        this.status = {
            online: navigator.onLine,
            quality: 'unknown',
            type: 'unknown',
            effectiveType: 'unknown',
            downlink: null,
            rtt: null,
            saveData: false,
            retryCount: 0,
            lastOnlineTime: Date.now(),
            recoveryMode: false
        };
        this.retryTimeout = null;
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds
        this.offlineCache = new Set();
        this.lowBandwidthThreshold = 1; // 1 Mbps
        this.initNetworkMonitoring();
    }

    initNetworkMonitoring() {
        // Online/offline status
        window.addEventListener('online', () => {
            this.handleOnline();
            this.updateStatus();
        });
        window.addEventListener('offline', () => {
            this.handleOffline();
            this.updateStatus();
        });

        // Network information API
        if ('connection' in navigator) {
            const connection = navigator.connection;
            connection.addEventListener('change', () => {
                this.handleConnectionChange();
                this.updateStatus();
            });
        }

        // Initial status check
        this.updateStatus();
    }

    handleOnline() {
        this.status.lastOnlineTime = Date.now();
        this.status.recoveryMode = true;
        this.status.retryCount = 0;
        this.processOfflineQueue();
        this.notifyStatusChange('online');
    }

    handleOffline() {
        this.status.recoveryMode = false;
        this.initRetryMechanism();
        this.notifyStatusChange('offline');
    }

    handleConnectionChange() {
        const oldQuality = this.status.quality;
        this.updateStatus();

        if (this.status.quality !== oldQuality) {
            if (this.isLowBandwidth()) {
                this.enableLowBandwidthMode();
            } else {
                this.disableLowBandwidthMode();
            }
        }
    }

    initRetryMechanism() {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }

        if (this.status.retryCount < this.maxRetries) {
            this.status.retryCount++;
            this.retryTimeout = setTimeout(() => {
                this.attemptReconnection();
            }, this.retryDelay * this.status.retryCount);
        }
    }

    attemptReconnection() {
        if (!this.status.online) {
            // Try to fetch a small resource to test connection
            fetch('/ping', { method: 'HEAD' })
                .then(() => {
                    this.handleOnline();
                })
                .catch(() => {
                    this.initRetryMechanism();
                });
        }
    }

    isLowBandwidth() {
        return (
            this.status.downlink < this.lowBandwidthThreshold ||
            this.status.quality === 'low' ||
            this.status.saveData
        );
    }

    enableLowBandwidthMode() {
        document.body.classList.add('low-bandwidth-mode');
        this.notifyStatusChange('low-bandwidth');

        // Pause non-critical requests
        this.pauseNonCriticalRequests();

        // Enable aggressive caching
        this.enableAggressiveCaching();
    }

    disableLowBandwidthMode() {
        document.body.classList.remove('low-bandwidth-mode');
        this.notifyStatusChange('normal-bandwidth');

        // Resume normal operation
        this.resumeNonCriticalRequests();
    }

    pauseNonCriticalRequests() {
        // Implement request prioritization
        window.dispatchEvent(new CustomEvent('pauseNonCritical', {
            detail: { reason: 'low-bandwidth' }
        }));
    }

    resumeNonCriticalRequests() {
        window.dispatchEvent(new CustomEvent('resumeNonCritical'));
    }

    enableAggressiveCaching() {
        window.dispatchEvent(new CustomEvent('enableAggressiveCaching'));
    }

    addToOfflineQueue(request) {
        this.offlineCache.add(request);
    }

    processOfflineQueue() {
        if (this.status.online && this.offlineCache.size > 0) {
            for (const request of this.offlineCache) {
                // Retry the request
                fetch(request)
                    .then(() => {
                        this.offlineCache.delete(request);
                    })
                    .catch(() => {
                        // Keep in queue if failed
                    });
            }
        }
    }

    updateStatus() {
        const oldStatus = { ...this.status };
        this.status.online = navigator.onLine;

        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.status.type = connection.type;
            this.status.effectiveType = connection.effectiveType;
            this.status.downlink = connection.downlink;
            this.status.rtt = connection.rtt;
            this.status.saveData = connection.saveData;
        } else {
            this.detectConnectionQuality();
        }

        this.status.quality = this.determineNetworkQuality();

        if (JSON.stringify(oldStatus) !== JSON.stringify(this.status)) {
            this.notifyStatusChange('status-update');
        }
    }

    detectConnectionQuality() {
        // Fallback connection detection using performance data
        if ('performance' in window && 'memory' in window.performance) {
            const memory = window.performance.memory;
            if (memory.jsHeapSizeLimit < 2147483648) { // Less than 2GB
                this.status.type = 'cellular';
                this.status.effectiveType = '3g';
            }
        }

        // Use battery API as additional indicator
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (battery.charging) {
                    this.status.type = 'wifi';
                }
            });
        }

        // Check for touch support as mobile indicator
        if ('maxTouchPoints' in navigator) {
            if (navigator.maxTouchPoints > 0) {
                if (!this.status.type) {
                    this.status.type = 'cellular';
                }
            }
        }
    }

    determineNetworkQuality() {
        if (!this.status.online) return 'offline';
        if (this.status.saveData) return 'low';

        if (this.status.effectiveType) {
            switch (this.status.effectiveType) {
                case 'slow-2g':
                case '2g':
                    return 'low';
                case '3g':
                    return 'medium';
                case '4g':
                    return 'high';
                default:
                    break;
            }
        }

        if (this.status.downlink) {
            if (this.status.downlink < 1) return 'low';
            if (this.status.downlink < 5) return 'medium';
            return 'high';
        }

        if (this.status.rtt) {
            if (this.status.rtt > 500) return 'low';
            if (this.status.rtt > 100) return 'medium';
            return 'high';
        }

        // Fallback based on connection type
        switch (this.status.type) {
            case 'bluetooth':
            case 'cellular':
                return 'medium';
            case 'ethernet':
            case 'wifi':
                return 'high';
            case 'none':
                return 'offline';
            default:
                return 'unknown';
        }
    }

    notifyStatusChange(reason) {
        window.dispatchEvent(new CustomEvent('networkQualityChange', {
            detail: {
                ...this.status,
                reason,
                timestamp: Date.now()
            }
        }));
    }

    getNetworkQuality() {
        return this.status.quality;
    }

    isOnline() {
        return this.status.online;
    }

    getConnectionInfo() {
        return { ...this.status };
    }

    getRetryCount() {
        return this.status.retryCount;
    }

    isRecoveryMode() {
        return this.status.recoveryMode;
    }

    getLastOnlineTime() {
        return this.status.lastOnlineTime;
    }

    setMaxRetries(count) {
        this.maxRetries = count;
    }

    setRetryDelay(delay) {
        this.retryDelay = delay;
    }

    setLowBandwidthThreshold(threshold) {
        this.lowBandwidthThreshold = threshold;
    }
}

// Initialize and export instance
const networkStatus = new NetworkStatus();
export default networkStatus; 
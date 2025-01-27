declare global {
    interface Navigator {
        connection?: {
            effectiveType: string;
            addEventListener: (type: string, listener: EventListener) => void;
            removeEventListener: (type: string, listener: EventListener) => void;
            downlink: number;
            rtt: number;
        };
    }
}

export type NetworkQuality = 'high' | 'medium' | 'low' | 'offline' | 'unknown';
export type ConnectionType = 'wifi' | 'cellular' | 'bluetooth' | 'ethernet' | 'none' | 'unknown';

interface NetworkState {
    online: boolean;
    quality: NetworkQuality;
    type: ConnectionType;
    effectiveType: string;
    downlink: number | null;
    rtt: number | null;
    saveData: boolean;
    retryCount: number;
    lastOnlineTime: number;
    recoveryMode: boolean;
}

interface NetworkMetrics {
    latency: number;
    bandwidth: number;
    jitter: number;
    packetLoss: number;
    timestamp: number;
}

export class NetworkStatus {
    private callbacks: ((quality: NetworkQuality) => void)[] = [];
    private latencyMeasurements: number[] = [];
    private readonly maxMeasurements = 10;
    private readonly latencyEndpoint = '/api/ping';

    constructor() {
        this.initializeNetworkMonitoring();
    }

    private initializeNetworkMonitoring(): void {
        if (navigator.connection) {
            navigator.connection.addEventListener('change', this.handleNetworkChange.bind(this));
        }
        window.addEventListener('online', this.handleOnlineStatus.bind(this));
        window.addEventListener('offline', this.handleOnlineStatus.bind(this));
    }

    private handleNetworkChange(): void {
        const quality = this.determineNetworkQuality();
        this.notifyCallbacks(quality);
    }

    private handleOnlineStatus(): void {
        const quality = this.determineNetworkQuality();
        this.notifyCallbacks(quality);
    }

    private notifyCallbacks(quality: NetworkQuality): void {
        this.callbacks.forEach(callback => callback(quality));
    }

    public onNetworkChange(callback: (quality: NetworkQuality) => void): void {
        this.callbacks.push(callback);
    }

    public isOnline(): boolean {
        return navigator.onLine;
    }

    private async measureLatency(): Promise<number> {
        try {
            const start = performance.now();
            await fetch(this.latencyEndpoint);
            const end = performance.now();
            const latency = end - start;

            this.latencyMeasurements.push(latency);
            if (this.latencyMeasurements.length > this.maxMeasurements) {
                this.latencyMeasurements.shift();
            }

            return latency;
        } catch (error) {
            console.error('Error measuring latency:', error);
            return -1;
        }
    }

    private getAverageLatency(): number {
        if (this.latencyMeasurements.length === 0) return -1;
        const sum = this.latencyMeasurements.reduce((acc, val) => acc + val, 0);
        return sum / this.latencyMeasurements.length;
    }

    public isMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    private determineNetworkQuality(): NetworkQuality {
        if (!navigator.onLine) return 'offline';

        const connection = navigator.connection;
        if (!connection) return 'unknown';

        const latency = this.getAverageLatency();
        const isMobile = this.isMobileDevice();

        // Mobile thresholds
        if (isMobile) {
            if (connection.effectiveType === '4g' && latency < 300) return 'high';
            if (connection.effectiveType === '3g' && latency < 500) return 'medium';
            return 'low';
        }

        // Desktop thresholds
        if (connection.effectiveType === '4g' && latency < 100) return 'high';
        if (connection.effectiveType === '3g' && latency < 300) return 'medium';
        return 'low';
    }

    public cleanup(): void {
        if (navigator.connection) {
            navigator.connection.removeEventListener('change', this.handleNetworkChange.bind(this));
        }
        window.removeEventListener('online', this.handleOnlineStatus.bind(this));
        window.removeEventListener('offline', this.handleOnlineStatus.bind(this));
        this.callbacks = [];
        this.latencyMeasurements = [];
    }
}

export default NetworkStatus; 
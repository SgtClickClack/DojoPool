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
export type ConnectionType =
  | 'wifi'
  | 'cellular'
  | 'bluetooth'
  | 'ethernet'
  | 'none'
  | 'unknown';

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
  private state: NetworkState = {
    online: navigator.onLine,
    quality: 'unknown',
    type: 'unknown',
    effectiveType: 'unknown',
    downlink: null,
    rtt: null,
    saveData: false,
    retryCount: 0,
    lastOnlineTime: Date.now(),
    recoveryMode: false,
  };
  private metrics: NetworkMetrics[] = [];

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private initializeNetworkMonitoring(): void {
    if (navigator.connection) {
      navigator.connection.addEventListener(
        'change',
        this.handleNetworkChange.bind(this)
      );
    }
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    this.startMetricsCollection();
  }

  private handleNetworkChange(): void {
    if (navigator.connection) {
      this.state.effectiveType = navigator.connection.effectiveType;
      this.state.downlink = navigator.connection.downlink;
      this.state.rtt = navigator.connection.rtt;
      this.updateNetworkQuality();
    }
  }

  private handleOnline(): void {
    this.state.online = true;
    this.state.lastOnlineTime = Date.now();
    this.updateNetworkQuality();
  }

  private handleOffline(): void {
    this.state.online = false;
    this.state.quality = 'offline';
    this.notifyCallbacks('offline');
  }

  private updateNetworkQuality(): void {
    const prevQuality = this.state.quality;
    if (!this.state.online) {
      this.state.quality = 'offline';
    } else if (this.state.rtt === null || this.state.downlink === null) {
      this.state.quality = 'unknown';
    } else if (this.state.rtt < 100 && this.state.downlink > 5) {
      this.state.quality = 'high';
    } else if (this.state.rtt < 300 && this.state.downlink > 2) {
      this.state.quality = 'medium';
    } else {
      this.state.quality = 'low';
    }

    if (prevQuality !== this.state.quality) {
      this.notifyCallbacks(this.state.quality);
    }
  }

  private async startMetricsCollection(): Promise<void> {
    try {
      const startTime = performance.now();
      const response = await fetch(this.latencyEndpoint);
      const endTime = performance.now();

      if (response.ok) {
        const latency = endTime - startTime;
        this.latencyMeasurements.push(latency);
        if (this.latencyMeasurements.length > this.maxMeasurements) {
          this.latencyMeasurements.shift();
        }

        const metrics: NetworkMetrics = {
          latency,
          bandwidth: this.state.downlink || 0,
          jitter: this.calculateJitter(),
          packetLoss: 0, // Would need server-side support for accurate measurement
          timestamp: Date.now(),
        };

        this.metrics.push(metrics);
        if (this.metrics.length > this.maxMeasurements) {
          this.metrics.shift();
        }
      }
    } catch (error) {
      console.error('Error collecting network metrics:', error);
    }
  }

  private calculateJitter(): number {
    if (this.latencyMeasurements.length < 2) return 0;
    let totalJitter = 0;
    for (let i = 1; i < this.latencyMeasurements.length; i++) {
      totalJitter += Math.abs(
        this.latencyMeasurements[i] - this.latencyMeasurements[i - 1]
      );
    }
    return totalJitter / (this.latencyMeasurements.length - 1);
  }

  private notifyCallbacks(quality: NetworkQuality): void {
    this.callbacks.forEach((callback) => callback(quality));
  }

  public getNetworkQuality(): NetworkQuality {
    return this.state.quality;
  }

  public getConnectionInfo(): { type: ConnectionType; effectiveType: string } {
    return {
      type: this.state.type,
      effectiveType: this.state.effectiveType,
    };
  }

  public getMetrics(): NetworkMetrics[] {
    return [...this.metrics];
  }

  public onQualityChange(callback: (quality: NetworkQuality) => void): void {
    this.callbacks.push(callback);
  }

  public destroy(): void {
    if (navigator.connection) {
      navigator.connection.removeEventListener(
        'change',
        this.handleNetworkChange.bind(this)
      );
    }
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
  }
}

export default NetworkStatus;

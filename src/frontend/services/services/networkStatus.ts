export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

class NetworkStatusService {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = { isOnline: navigator.onLine };

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Listen for online/offline events
    window.addEventListener('online', () =>
      this.updateStatus({ isOnline: true })
    );
    window.addEventListener('offline', () =>
      this.updateStatus({ isOnline: false })
    );

    // Listen for connection changes if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => this.updateConnectionInfo());
      this.updateConnectionInfo();
    }

    // Initial status
    this.updateStatus({ isOnline: navigator.onLine });
  }

  private updateConnectionInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateStatus({
        ...this.currentStatus,
        connectionType: connection.effectiveType || 'unknown',
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    }
  }

  private updateStatus(newStatus: Partial<NetworkStatus>) {
    this.currentStatus = { ...this.currentStatus, ...newStatus };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentStatus));
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current status
    listener(this.currentStatus);

    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  public unsubscribe(listener: (status: NetworkStatus) => void): void {
    this.listeners.delete(listener);
  }

  public async checkConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  public getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'unknown' {
    if (!this.currentStatus.effectiveType) return 'unknown';

    switch (this.currentStatus.effectiveType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
      case 'slow-2g':
        return 'poor';
      default:
        return 'unknown';
    }
  }
}

// Export singleton instance
export const networkStatusService = new NetworkStatusService();

// Export the class for testing
export { NetworkStatusService };

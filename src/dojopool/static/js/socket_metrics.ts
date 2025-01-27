/**
 * Optimized metrics collector for WebSocket connections.
 */

class SocketMetrics {
    private static instance: SocketMetrics;
    private messagesSent = 0;
    private messagesReceived = 0;
    private reconnectAttempts = 0;
    private totalLatency = 0;
    private latencyMeasurements = 0;
    private lastMessageTime: number | null = null;
    private connectionStartTime: number | null = null;
    private lastStats: any = null;
    private lastStatsTime = 0;
    private readonly STATS_CACHE_TIME = 1000; // Cache stats for 1 second

    private constructor() { }

    public static getInstance(): SocketMetrics {
        if (!SocketMetrics.instance) {
            SocketMetrics.instance = new SocketMetrics();
        }
        return SocketMetrics.instance;
    }

    public trackMessageSent(): void {
        this.messagesSent++;
        this.lastMessageTime = Date.now();
    }

    public trackMessageReceived(latency?: number): void {
        this.messagesReceived++;
        this.lastMessageTime = Date.now();

        if (latency) {
            this.totalLatency += latency;
            this.latencyMeasurements++;
        }
    }

    public trackReconnect(): void {
        this.reconnectAttempts++;
    }

    public trackConnect(): void {
        this.connectionStartTime = Date.now();
    }

    public getStats(): {
        messagesSent: number;
        messagesReceived: number;
        reconnectAttempts: number;
        averageLatency: number;
        lastMessageTime: Date | null;
        connectionDuration: number;
    } {
        const now = Date.now();

        // Return cached stats if within cache time
        if (this.lastStats && now - this.lastStatsTime < this.STATS_CACHE_TIME) {
            return this.lastStats;
        }

        // Calculate new stats
        const stats = {
            messagesSent: this.messagesSent,
            messagesReceived: this.messagesReceived,
            reconnectAttempts: this.reconnectAttempts,
            averageLatency: this.latencyMeasurements > 0
                ? this.totalLatency / this.latencyMeasurements
                : 0,
            lastMessageTime: this.lastMessageTime ? new Date(this.lastMessageTime) : null,
            connectionDuration: this.connectionStartTime
                ? now - this.connectionStartTime
                : 0
        };

        // Cache the stats
        this.lastStats = stats;
        this.lastStatsTime = now;

        return stats;
    }

    public reset(): void {
        this.messagesSent = 0;
        this.messagesReceived = 0;
        this.reconnectAttempts = 0;
        this.totalLatency = 0;
        this.latencyMeasurements = 0;
        this.lastMessageTime = null;
        this.connectionStartTime = null;
        this.lastStats = null;
        this.lastStatsTime = 0;
    }
}

// Create singleton instance
export const socketMetrics = SocketMetrics.getInstance(); 
import pako from 'pako';
import { Socket, io } from 'socket.io-client';

interface PooledSocket extends Socket {
    isAvailable: boolean;
    lastUsed: number;
    reconnectAttempts: number;
    messageQueue: Array<{ event: string; data: any; }>;
    isProcessing: boolean;
}

class SocketPool {
    private pool: PooledSocket[] = [];
    private readonly maxSize: number;
    private readonly maxAge: number;
    private readonly options: any;
    private readonly backoffTimes = [1000, 2000, 4000, 8000, 16000];
    private cleanupInterval: number | null = null;
    private readonly compressionThreshold = 1024; // Compress messages larger than 1KB

    constructor(maxSize = 5, maxAge = 300000) {
        this.maxSize = maxSize;
        this.maxAge = maxAge;
        this.options = {
            transports: ['websocket'],
            autoConnect: true,
            reconnectionAttempts: this.backoffTimes.length,
            reconnectionDelay: this.backoffTimes[0],
            timeout: 10000,
            perMessageDeflate: true,
            auth: {
                token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
        };

        this.startCleanupInterval();
    }

    private startCleanupInterval(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cleanupInterval = window.setInterval(() => this.cleanup(), 60000);
    }

    async getSocket(): Promise<Socket> {
        this.cleanup();

        // Try to find an available socket with the least load
        const availableSocket = this.pool
            .filter(socket => socket.isAvailable && socket.connected && !socket.isProcessing)
            .sort((a, b) => (a.messageQueue.length + a.reconnectAttempts) - (b.messageQueue.length + b.reconnectAttempts))[0];

        if (availableSocket) {
            availableSocket.isAvailable = false;
            availableSocket.lastUsed = Date.now();
            return availableSocket;
        }

        // Remove disconnected or overloaded sockets
        if (this.pool.length >= this.maxSize) {
            this.pool = this.pool.filter(socket =>
                socket.connected &&
                socket.messageQueue.length < 100 &&
                socket.reconnectAttempts < this.backoffTimes.length
            );
        }

        if (this.pool.length < this.maxSize) {
            const socket = this.createSocket();
            this.pool.push(socket);
            return socket;
        }

        return this.waitForAvailableSocket();
    }

    private async waitForAvailableSocket(): Promise<Socket> {
        let attempt = 0;
        while (attempt < this.backoffTimes.length) {
            await new Promise(resolve => setTimeout(resolve, this.backoffTimes[attempt]));

            const availableSocket = this.pool.find(s => s.isAvailable && s.connected && !s.isProcessing);
            if (availableSocket) {
                availableSocket.isAvailable = false;
                availableSocket.lastUsed = Date.now();
                return availableSocket;
            }

            attempt++;
        }
        throw new Error('No sockets available after maximum retries');
    }

    private createSocket(): PooledSocket {
        const socket = io(window.location.origin, this.options) as PooledSocket;
        socket.isAvailable = false;
        socket.lastUsed = Date.now();
        socket.reconnectAttempts = 0;
        socket.messageQueue = [];
        socket.isProcessing = false;

        // Enhance socket with message compression
        const originalEmit = socket.emit;
        socket.emit = (event: string, ...args: any[]): boolean => {
            const data = args[0];
            if (data && typeof data === 'object' && JSON.stringify(data).length > this.compressionThreshold) {
                const compressed = pako.deflate(JSON.stringify(data));
                return originalEmit.call(socket, event, { compressed: true, data: compressed }, ...args.slice(1));
            }
            return originalEmit.call(socket, event, ...args);
        };

        socket.on('connect', () => {
            socket.reconnectAttempts = 0;
            this.processMessageQueue(socket);
        });

        socket.on('disconnect', () => {
            socket.isAvailable = true;
            socket.reconnectAttempts++;
            socket.isProcessing = false;
        });

        socket.on('connect_error', () => {
            socket.reconnectAttempts++;
            socket.isProcessing = false;
        });

        return socket;
    }

    private async processMessageQueue(socket: PooledSocket): Promise<void> {
        if (socket.isProcessing || socket.messageQueue.length === 0) return;

        socket.isProcessing = true;
        while (socket.messageQueue.length > 0 && socket.connected) {
            const message = socket.messageQueue.shift();
            if (message) {
                try {
                    await new Promise((resolve, reject) => {
                        socket.emit(message.event, message.data, (response: any) => {
                            if (response?.error) reject(response.error);
                            else resolve(response);
                        });
                    });
                } catch (error) {
                    console.error('Error processing message:', error);
                    if (socket.messageQueue.length < 100) {
                        socket.messageQueue.push(message); // Retry failed messages
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 10)); // Prevent event loop blocking
        }
        socket.isProcessing = false;
    }

    private cleanup(): void {
        const now = Date.now();
        this.pool = this.pool.filter(socket => {
            const isExpired = now - socket.lastUsed > this.maxAge;
            const hasExceededRetries = socket.reconnectAttempts >= this.backoffTimes.length;
            const isOverloaded = socket.messageQueue.length >= 100;

            if (isExpired || !socket.connected || hasExceededRetries || isOverloaded) {
                socket.disconnect();
                return false;
            }
            return true;
        });
    }

    releaseSocket(socket: Socket): void {
        const pooledSocket = this.pool.find(s => s === socket) as PooledSocket;
        if (pooledSocket) {
            pooledSocket.isAvailable = true;
            pooledSocket.lastUsed = Date.now();
            this.processMessageQueue(pooledSocket);
        }
    }

    disconnectAll(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.pool.forEach(socket => socket.disconnect());
        this.pool = [];
    }
}

export const socketPool = new SocketPool();
export type { PooledSocket };


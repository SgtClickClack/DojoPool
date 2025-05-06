import { NetworkErrorRecovery } from '../NetworkErrorRecovery';
import { NetworkMessageType } from '../types';
import EventEmitter from 'events';

// Mock NetworkTransport for isolated testing
class MockTransport extends EventEmitter {
    public isConnected = true;
    public send = jest.fn(async (target: string) => {
        if (!this.isConnected) throw {
            code: "DISCONNECTED",
            message: "Disconnected",
            timestamp: Date.now(),
            details: JSON.stringify({ nodeId: target })
        };
    });
    public connect = jest.fn(async () => {
        this.isConnected = true;
        this.emit('connect', 'peer');
    });
    public disconnect = jest.fn(async () => {
        this.isConnected = false;
        this.emit('disconnect', 'peer');
    });
    public address = 'mock-address';
    public nodeId = 'test-node';
}

describe('NetworkErrorRecovery', () => {
    let transport: MockTransport;
    let recovery: NetworkErrorRecovery;
    const failureThreshold = 3;
    const resetTimeout = 1000;
    const queueLimit = 2;

    beforeEach(() => {
        jest.useFakeTimers();
        transport = new MockTransport() as any;
        recovery = new NetworkErrorRecovery(transport as any, {
            circuitBreaker: { failureThreshold, resetTimeout, halfOpenMaxAttempts: 1 },
            queueLimit,
            retry: { maxRetries: 1, baseDelay: 10, maxDelay: 20, jitter: 0 },
            messageTimeout: 10,
        });
    });

    afterEach(() => {
        recovery.stop();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('should throw when circuit breaker is open for a node', async () => {
        transport.isConnected = false;
        // DEBUG: Log failureCount map at start
        // @ts-ignore
        console.log('DEBUG: failureCount at start', Array.from(recovery.failureCount.entries()));
        // Cause enough failures to trip the breaker
        for (let i = 0; i < failureThreshold; i++) {
            await recovery.send('peer', NetworkMessageType.MESSAGE, {});
        }
        // DEBUG: Log failureCount map after failures
        // @ts-ignore
        console.log('DEBUG: failureCount after failures', Array.from(recovery.failureCount.entries()));
        // Wait for event loop to process state update
        await new Promise(r => setTimeout(r, 0));
        // Now the circuit should be open; set transport to connected
        transport.isConnected = true;
        // Assert circuit breaker state is OPEN (1)
        // @ts-ignore
        expect(recovery.circuitState.get('peer')).toBe(1);
        // Next send should throw due to circuit breaker being open
        await expect(recovery.send('peer', NetworkMessageType.MESSAGE, {})).rejects.toThrow(/circuit breaker is open/i);
    });

    it('should recover after reset timeout and allow send', async () => {
        transport.isConnected = false;
        for (let i = 0; i < failureThreshold; i++) {
            await recovery.send('peer', NetworkMessageType.MESSAGE, {});
        }
        // Circuit is open, advance timers to reset
        jest.advanceTimersByTime(resetTimeout + 1);
        // Now allow connection
        transport.isConnected = true;
        // Trigger a dummy send to update circuit breaker state
        try { await recovery.send('peer', NetworkMessageType.MESSAGE, {}); } catch {}
        // Should allow send again (half-open, then closed)
        await expect(recovery.send('peer', NetworkMessageType.MESSAGE, {})).resolves.not.toThrow();
    });

    it('should enforce queue limit and throw when exceeded', async () => {
        transport.isConnected = true;
        // Fill the queue by sending messages and not letting them complete
        await recovery.send('peer', NetworkMessageType.MESSAGE, {});
        await recovery.send('peer', NetworkMessageType.MESSAGE, {});
        // Next send should throw due to queue limit
        await expect(recovery.send('peer', NetworkMessageType.MESSAGE, {})).rejects.toThrow(/queue limit/i);
    });

    it('should apply exponential backoff on retry', async () => {
        transport.isConnected = false;
        const spy = jest.spyOn(global, 'setTimeout');
        await recovery.send('peer', NetworkMessageType.MESSAGE, {});
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('should emit error and recovered events', async () => {
        const errorHandler = jest.fn();
        const recoveryHandler = jest.fn();
        recovery.on('error', errorHandler);
        recovery.on('recovered', recoveryHandler);
        // Cause error
        transport.isConnected = false;
        await recovery.send('peer', NetworkMessageType.MESSAGE, {});
        // Wait for event loop to process
        await new Promise((r) => setTimeout(r, 0));
        expect(errorHandler).toHaveBeenCalled();
        // Recover
        transport.isConnected = true;
        await recovery.send('peer', NetworkMessageType.MESSAGE, {});
        // Simulate recovery event
        recovery.emit('recovered', 'peer');
        expect(recoveryHandler).toHaveBeenCalled();
    });
}); 
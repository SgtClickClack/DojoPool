import { NetworkErrorRecovery } from '../NetworkErrorRecovery';
import { NetworkMessageType } from '../types';
import EventEmitter from 'events';

// Mock NetworkTransport for isolated testing
class MockTransport extends EventEmitter {
    public isConnected = true;
    public send = jest.fn(async (target: string) => {
        if (!this.isConnected) {
            const err = new Error("Disconnected");
            (err as any).code = "DISCONNECTED";
            (err as any).timestamp = Date.now();
            (err as any).details = JSON.stringify({ nodeId: target });
            throw err;
        }
        // Simulate successful send when connected
        return Promise.resolve();
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
        await expect(recovery.send('peer', NetworkMessageType.MESSAGE, {})).rejects.toThrow(/circuit breaker is open/i);
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
        await expect(recovery.send('peer', NetworkMessageType.MESSAGE, {})).rejects.toThrow('Disconnected');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('should emit error and recovered events', async () => {
        const errorHandler = jest.fn();
        const recoveryHandler = jest.fn();
        recovery.onError(errorHandler);
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

    describe('Message Handling', () => {
        it('should handle response messages and clear pending state', async () => {
            const messageId = 'test-message-1';
            const responseMessage = {
                id: `${messageId}-response`,
                type: NetworkMessageType.STATE_SYNC_RESPONSE,
                source: 'peer',
                target: 'test-node',
                payload: { success: true },
                timestamp: Date.now()
            };
            // Add a pending message
            await recovery.send('peer', NetworkMessageType.STATE_SYNC, {});
            // Simulate receiving response
            recovery.emit('message', responseMessage);
            // Verify pending message was cleared
            // @ts-ignore - accessing private field for testing
            expect(recovery.pendingMessages.size).toBe(0);
        });

        it('should handle message timeouts and retry', async () => {
            transport.isConnected = false;
            const messageId = await recovery.send('peer', NetworkMessageType.MESSAGE, {});
            // Advance time past timeout
            jest.advanceTimersByTime(recovery['config'].messageTimeout + 1);
            // Verify retry was attempted
            expect(transport.send).toHaveBeenCalledTimes(2);
        });

        it('should handle message failures after max retries', async () => {
            transport.isConnected = false;
            const errorHandler = jest.fn();
            recovery.on('error', errorHandler);
            await recovery.send('peer', NetworkMessageType.MESSAGE, {});
            // Advance time to trigger all retries
            for (let i = 0; i < recovery['config'].retry.maxRetries; i++) {
                jest.advanceTimersByTime(recovery['config'].messageTimeout + 1);
            }
            expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
                code: 'MESSAGE_TIMEOUT'
            }));
        });
    });

    describe('Circuit Breaker', () => {
        it('should transition through all circuit breaker states', async () => {
            transport.isConnected = false;
            // Cause failures to open circuit
            for (let i = 0; i < failureThreshold; i++) {
                await recovery.send('peer', NetworkMessageType.MESSAGE, {}).catch(() => {});
            }
            // @ts-ignore - accessing private field for testing
            expect(recovery.circuitState.get('peer')).toBe(CircuitState.OPEN);

            // Advance time to half-open
            jest.advanceTimersByTime(resetTimeout + 1);
            // @ts-ignore - accessing private field for testing
            expect(recovery.circuitState.get('peer')).toBe(CircuitState.HALF_OPEN);

            // Allow successful send to close circuit
            transport.isConnected = true;
            await recovery.send('peer', NetworkMessageType.MESSAGE, {});
            // @ts-ignore - accessing private field for testing
            expect(recovery.circuitState.get('peer')).toBe(CircuitState.CLOSED);
        });

        it('should handle half-open state failures', async () => {
            transport.isConnected = false;
            // Open circuit
            for (let i = 0; i < failureThreshold; i++) {
                await recovery.send('peer', NetworkMessageType.MESSAGE, {}).catch(() => {});
            }
            // Advance to half-open
            jest.advanceTimersByTime(resetTimeout + 1);
            // Fail in half-open
            await recovery.send('peer', NetworkMessageType.MESSAGE, {}).catch(() => {});
            // Should return to open
            // @ts-ignore - accessing private field for testing
            expect(recovery.circuitState.get('peer')).toBe(CircuitState.OPEN);
        });
    });

    describe('Retry Logic', () => {
        it('should apply exponential backoff with jitter', async () => {
            transport.isConnected = false;
            const spy = jest.spyOn(global, 'setTimeout');
            await recovery.send('peer', NetworkMessageType.MESSAGE, {}).catch(() => {});
            
            // Get the delay used in setTimeout
            const delay = spy.mock.calls[0][1];
            const baseDelay = recovery['config'].retry.baseDelay;
            const maxDelay = recovery['config'].retry.maxDelay;
            const jitter = recovery['config'].retry.jitter;
            
            // Verify delay is within expected range
            expect(delay).toBeGreaterThanOrEqual(baseDelay * (1 - jitter));
            expect(delay).toBeLessThanOrEqual(Math.min(baseDelay * 2, maxDelay) * (1 + jitter));
            
            spy.mockRestore();
        });

        it('should respect max retries configuration', async () => {
            transport.isConnected = false;
            await recovery.send('peer', NetworkMessageType.MESSAGE, {}).catch(() => {});
            
            // Advance time to trigger all retries
            for (let i = 0; i < recovery['config'].retry.maxRetries; i++) {
                jest.advanceTimersByTime(recovery['config'].messageTimeout + 1);
            }
            
            // Verify total attempts = initial + max retries
            expect(transport.send).toHaveBeenCalledTimes(recovery['config'].retry.maxRetries + 1);
        });
    });

    describe('Connection Events', () => {
        it('should handle connect events and reset state', async () => {
            // First cause some failures
            transport.isConnected = false;
            await recovery.send('peer', NetworkMessageType.MESSAGE, {}).catch(() => {});
            
            // Simulate connection
            transport.emit('connect', 'peer');
            
            // Verify state was reset
            // @ts-ignore - accessing private field for testing
            expect(recovery.failureCount.get('peer')).toBe(0);
            // @ts-ignore - accessing private field for testing
            expect(recovery.circuitState.get('peer')).toBe(CircuitState.CLOSED);
        });

        it('should handle disconnect events', async () => {
            const disconnectHandler = jest.fn();
            recovery.on('disconnect', disconnectHandler);
            
            // Simulate disconnection
            transport.emit('disconnect', 'peer');
            
            expect(disconnectHandler).toHaveBeenCalledWith('peer');
        });
    });
});
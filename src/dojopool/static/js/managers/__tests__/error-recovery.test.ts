import { ErrorRecoveryManager, RecoveryError, RecoveryStrategy } from '../error-recovery';

describe('ErrorRecoveryManager', () => {
    let recoveryManager: ErrorRecoveryManager;
    let mockStrategy: RecoveryStrategy;

    beforeEach(() => {
        recoveryManager = ErrorRecoveryManager.getInstance();
        mockStrategy = {
            name: 'testStrategy',
            pattern: /test error/,
            handler: jest.fn().mockResolvedValue(true),
            maxAttempts: 3,
            cooldownMs: 1000
        };
    });

    afterEach(() => {
        recoveryManager.cleanup();
    });

    describe('Initialization', () => {
        it('should initialize with empty strategies and history', () => {
            expect(recoveryManager.getRecoveryHistory()).toHaveLength(0);
        });

        it('should be a singleton', () => {
            const instance1 = ErrorRecoveryManager.getInstance();
            const instance2 = ErrorRecoveryManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Strategy Registration', () => {
        it('should register a new strategy', () => {
            recoveryManager.registerStrategy(mockStrategy);
            const error = new Error('test error');
            recoveryManager.handleError(error);
            expect(mockStrategy.handler).toHaveBeenCalled();
        });

        it('should throw when registering duplicate strategy', () => {
            recoveryManager.registerStrategy(mockStrategy);
            expect(() => recoveryManager.registerStrategy(mockStrategy))
                .toThrow('Strategy testStrategy already exists');
        });
    });

    describe('Error Handling', () => {
        it('should match error with strategy pattern', async () => {
            recoveryManager.registerStrategy(mockStrategy);
            const error = new Error('test error');
            const handled = await recoveryManager.handleError(error);
            expect(handled).toBe(true);
            expect(mockStrategy.handler).toHaveBeenCalled();
        });

        it('should not handle unmatched errors', async () => {
            recoveryManager.registerStrategy(mockStrategy);
            const error = new Error('unmatched error');
            const handled = await recoveryManager.handleError(error);
            expect(handled).toBe(false);
            expect(mockStrategy.handler).not.toHaveBeenCalled();
        });

        it('should respect max attempts', async () => {
            recoveryManager.registerStrategy(mockStrategy);
            const error = new Error('test error');
            
            // Attempt recovery maxAttempts times
            for (let i = 0; i < mockStrategy.maxAttempts!; i++) {
                await recoveryManager.handleError(error);
            }
            
            // Next attempt should be ignored
            const handled = await recoveryManager.handleError(error);
            expect(handled).toBe(false);
            expect(mockStrategy.handler).toHaveBeenCalledTimes(mockStrategy.maxAttempts!);
        });

        it('should respect cooldown period', async () => {
            recoveryManager.registerStrategy(mockStrategy);
            const error = new Error('test error');
            
            // First attempt
            await recoveryManager.handleError(error);
            
            // Immediate second attempt should be ignored
            const handled = await recoveryManager.handleError(error);
            expect(handled).toBe(false);
            expect(mockStrategy.handler).toHaveBeenCalledTimes(1);
        });

        it('should handle strategy execution errors', async () => {
            const failingStrategy: RecoveryStrategy = {
                name: 'failingStrategy',
                pattern: /test error/,
                handler: jest.fn().mockRejectedValue(new Error('Strategy failed')),
                maxAttempts: 3
            };
            
            recoveryManager.registerStrategy(failingStrategy);
            const error = new Error('test error');
            
            await expect(recoveryManager.handleError(error))
                .rejects.toThrow('Recovery strategy failingStrategy failed');
        });
    });

    describe('Recovery History', () => {
        it('should maintain recovery history', async () => {
            recoveryManager.registerStrategy(mockStrategy);
            const error = new Error('test error');
            
            await recoveryManager.handleError(error);
            const history = recoveryManager.getRecoveryHistory();
            
            expect(history).toHaveLength(1);
            expect(history[0]).toEqual(expect.objectContaining({
                error: 'Error: test error',
                strategy: 'testStrategy',
                success: true,
                attemptCount: 1
            }));
        });

        it('should limit history size', async () => {
            recoveryManager.registerStrategy(mockStrategy);
            const error = new Error('test error');
            
            // Generate more recovery attempts than maxHistorySize
            for (let i = 0; i < 150; i++) {
                await recoveryManager.handleError(error);
            }
            
            const history = recoveryManager.getRecoveryHistory();
            expect(history.length).toBeLessThanOrEqual(100);
        });
    });

    describe('Cleanup', () => {
        it('should clear strategies and history on cleanup', async () => {
            recoveryManager.registerStrategy(mockStrategy);
            const error = new Error('test error');
            
            await recoveryManager.handleError(error);
            recoveryManager.cleanup();
            
            expect(recoveryManager.getRecoveryHistory()).toHaveLength(0);
            
            // Attempting to handle error after cleanup should not trigger strategy
            const handled = await recoveryManager.handleError(error);
            expect(handled).toBe(false);
            expect(mockStrategy.handler).toHaveBeenCalledTimes(1);
        });
    });
}); 
import { TransitionManager } from '../transition-manager';
import { WebGLContextManager } from '../webgl-context-manager';
import { ShaderManager } from '../shader-manager';

// Mock WebGLContextManager
jest.mock('../webgl-context-manager', () => ({
    WebGLContextManager: {
        getInstance: jest.fn().mockReturnValue({
            getQualityLevel: jest.fn().mockReturnValue(1),
            setQualityLevel: jest.fn()
        })
    }
}));

// Mock ShaderManager
jest.mock('../shader-manager', () => ({
    ShaderManager: jest.fn().mockImplementation(() => ({
        cleanup: jest.fn()
    }))
}));

describe('TransitionManager', () => {
    let transitionManager: TransitionManager;
    let mockContextManager: WebGLContextManager;
    let mockShaderManager: ShaderManager;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock managers
        mockContextManager = WebGLContextManager.getInstance();
        mockShaderManager = new ShaderManager(mockContextManager);

        // Create TransitionManager instance
        transitionManager = new TransitionManager(mockContextManager, mockShaderManager);
    });

    afterEach(() => {
        transitionManager.cleanup();
    });

    describe('Initialization', () => {
        it('should initialize with correct managers', () => {
            expect(transitionManager).toBeDefined();
            expect(mockContextManager).toBeDefined();
            expect(mockShaderManager).toBeDefined();
        });
    });

    describe('Quality Transitions', () => {
        it('should start transition to valid quality level', () => {
            transitionManager.startTransition(2);
            expect(mockContextManager.setQualityLevel).toHaveBeenCalled();
        });

        it('should throw error for invalid quality level', () => {
            expect(() => {
                transitionManager.startTransition(0);
            }).toThrow('Invalid quality level: 0');

            expect(() => {
                transitionManager.startTransition(4);
            }).toThrow('Invalid quality level: 4');
        });

        it('should not start transition if already at target quality', () => {
            (mockContextManager.getQualityLevel as jest.Mock).mockReturnValue(2);
            transitionManager.startTransition(2);
            expect(mockContextManager.setQualityLevel).not.toHaveBeenCalled();
        });

        it('should cancel current transition when starting new one', () => {
            // Mock requestAnimationFrame
            const mockRAF = jest.spyOn(window, 'requestAnimationFrame');
            const mockCancelRAF = jest.spyOn(window, 'cancelAnimationFrame');

            transitionManager.startTransition(2);
            transitionManager.startTransition(3);

            expect(mockCancelRAF).toHaveBeenCalled();
            expect(mockRAF).toHaveBeenCalled();
        });
    });

    describe('Transition Events', () => {
        it('should dispatch progress events during transition', () => {
            const progressHandler = jest.fn();
            window.addEventListener('qualitytransitionprogress', progressHandler);

            transitionManager.startTransition(2);
            jest.advanceTimersByTime(500); // Halfway through transition

            expect(progressHandler).toHaveBeenCalled();
            expect(progressHandler.mock.calls[0][0].detail.progress).toBeGreaterThan(0);
            expect(progressHandler.mock.calls[0][0].detail.progress).toBeLessThan(1);
        });

        it('should dispatch complete event when transition finishes', () => {
            const completeHandler = jest.fn();
            window.addEventListener('qualitytransitioncomplete', completeHandler);

            transitionManager.startTransition(2);
            jest.advanceTimersByTime(1000); // Complete transition

            expect(completeHandler).toHaveBeenCalled();
            expect(completeHandler.mock.calls[0][0].detail.quality).toBe(2);
        });
    });

    describe('Progress Calculation', () => {
        it('should calculate eased progress correctly', () => {
            const progress = 0.5;
            const easedProgress = (transitionManager as any).calculateEasedProgress(progress);
            expect(easedProgress).toBeGreaterThan(0);
            expect(easedProgress).toBeLessThan(1);
        });

        it('should interpolate quality levels correctly', () => {
            const start = 1;
            const end = 3;
            const progress = 0.5;
            const interpolated = (transitionManager as any).interpolateQuality(start, end, progress);
            expect(interpolated).toBe(2);
        });
    });

    describe('Cleanup', () => {
        it('should cancel animation frame on cleanup', () => {
            const mockCancelRAF = jest.spyOn(window, 'cancelAnimationFrame');
            transitionManager.startTransition(2);
            transitionManager.cleanup();
            expect(mockCancelRAF).toHaveBeenCalled();
        });

        it('should clean up transition state', () => {
            transitionManager.startTransition(2);
            transitionManager.cleanup();
            expect((transitionManager as any).currentTransition).toBeNull();
            expect((transitionManager as any).transitionFrameId).toBeNull();
        });

        it('should call parent cleanup', () => {
            const mockOnCleanup = jest.spyOn(transitionManager as any, 'onCleanup');
            transitionManager.cleanup();
            expect(mockOnCleanup).toHaveBeenCalled();
        });
    });

    describe('Performance', () => {
        it('should maintain smooth transition', () => {
            const startTime = performance.now();
            transitionManager.startTransition(2);
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // Should start transition quickly
        });

        it('should handle multiple transitions efficiently', () => {
            for (let i = 0; i < 5; i++) {
                transitionManager.startTransition(2);
                transitionManager.startTransition(1);
            }
            expect(mockContextManager.setQualityLevel).toHaveBeenCalled();
        });
    });
}); 
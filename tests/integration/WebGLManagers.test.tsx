import { ShaderManager } from '../../src/dojopool/static/js/managers/shader-manager';
import { WebGLContextManager } from '../../src/dojopool/static/js/managers/webgl-context-manager';
import { TransitionManager } from '../../src/dojopool/static/js/managers/transition-manager';
import { PerformanceBudgetManager } from '../../src/dojopool/static/js/managers/performance-budget-manager';
import { ErrorRecoveryManager } from '../../src/dojopool/static/js/managers/error-recovery-manager';

describe('WebGL Managers Integration', () => {
    let canvas: HTMLCanvasElement;
    let contextManager: WebGLContextManager;
    let shaderManager: ShaderManager;
    let transitionManager: TransitionManager;
    let performanceManager: PerformanceBudgetManager;
    let errorManager: ErrorRecoveryManager;

    beforeEach(() => {
        // Set up canvas and WebGL context
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);

        // Initialize managers
        contextManager = new WebGLContextManager(canvas);
        shaderManager = new ShaderManager(contextManager);
        transitionManager = new TransitionManager(contextManager);
        performanceManager = new PerformanceBudgetManager();
        errorManager = ErrorRecoveryManager.getInstance();

        // Set up error recovery strategies
        errorManager.registerStrategy({
            pattern: /WebGL context lost/,
            maxAttempts: 3,
            cooldown: 1000,
            recover: async () => {
                await contextManager.handleContextLost();
                return true;
            }
        });
    });

    afterEach(() => {
        // Clean up
        document.body.removeChild(canvas);
        contextManager.cleanup();
        shaderManager.cleanup();
        transitionManager.cleanup();
        performanceManager.cleanup();
        errorManager.cleanup();
    });

    describe('Shader and Context Integration', () => {
        it('should handle shader compilation through context manager', async () => {
            const shaderDefs = [{
                vertex: `
                    attribute vec2 position;
                    void main() {
                        gl_Position = vec4(position, 0.0, 1.0);
                    }
                `,
                fragment: `
                    precision mediump float;
                    void main() {
                        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                    }
                `,
                complexity: 0.5
            }];

            shaderManager.registerShader('testShader', shaderDefs);
            const program = shaderManager.useShader('testShader');
            
            expect(program).toBeDefined();
            expect(contextManager.getContext()).toBeDefined();
        });

        it('should handle context loss and recovery', async () => {
            const shaderDefs = [{
                vertex: 'vertex shader source',
                fragment: 'fragment shader source',
                complexity: 0.5
            }];

            shaderManager.registerShader('testShader', shaderDefs);
            
            // Simulate context loss
            const loseContext = contextManager.getContext()?.getExtension('WEBGL_lose_context');
            if (loseContext) {
                loseContext.loseContext();
                
                // Wait for context to be lost
                await new Promise(resolve => setTimeout(resolve, 100));
                
                expect(shaderManager.useShader('testShader')).toBeNull();
                
                // Restore context
                loseContext.restoreContext();
                
                // Wait for context to be restored
                await new Promise(resolve => setTimeout(resolve, 100));
                
                expect(shaderManager.useShader('testShader')).toBeDefined();
            }
        });
    });

    describe('Performance and Transition Integration', () => {
        it('should adjust shader quality based on performance budget', async () => {
            const shaderDefs = [
                {
                    vertex: 'low quality vertex shader',
                    fragment: 'low quality fragment shader',
                    complexity: 0.3
                },
                {
                    vertex: 'high quality vertex shader',
                    fragment: 'high quality fragment shader',
                    complexity: 0.9
                }
            ];

            shaderManager.registerShader('testShader', shaderDefs);
            
            // Set a low performance budget
            performanceManager.setBudget('frame', 16); // 60fps
            
            // Simulate performance issues
            performanceManager.recordMetric('frame', 20); // Above budget
            
            // Wait for transition
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const program = shaderManager.useShader('testShader');
            expect(program).toBeDefined();
            
            // Verify we're using the lower quality shader
            expect(contextManager.getQualityLevel()).toBeLessThan(2);
        });

        it('should handle smooth transitions between quality levels', async () => {
            const shaderDefs = [
                {
                    vertex: 'low quality vertex shader',
                    fragment: 'low quality fragment shader',
                    complexity: 0.3
                },
                {
                    vertex: 'high quality vertex shader',
                    fragment: 'high quality fragment shader',
                    complexity: 0.9
                }
            ];

            shaderManager.registerShader('testShader', shaderDefs);
            
            // Start transition
            transitionManager.startTransition(1, 3);
            
            // Check intermediate states
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const progress = transitionManager.getProgress();
            expect(progress).toBeGreaterThan(0);
            expect(progress).toBeLessThan(1);
            
            // Wait for transition to complete
            await new Promise(resolve => setTimeout(resolve, 200));
            
            expect(transitionManager.getProgress()).toBe(1);
        });
    });

    describe('Error Recovery Integration', () => {
        it('should recover from shader compilation errors', async () => {
            const invalidShaderDefs = [{
                vertex: 'invalid vertex shader',
                fragment: 'invalid fragment shader',
                complexity: 0.5
            }];

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            shaderManager.registerShader('invalidShader', invalidShaderDefs);
            
            expect(errorManager.getRecoveryHistory().length).toBeGreaterThan(0);
            expect(shaderManager.useShader('invalidShader')).toBeNull();
            
            consoleSpy.mockRestore();
        });

        it('should handle cascading manager failures gracefully', async () => {
            // Simulate a severe error that affects multiple managers
            const loseContext = contextManager.getContext()?.getExtension('WEBGL_lose_context');
            if (loseContext) {
                // Register performance monitoring
                performanceManager.startMonitoring();
                
                // Set up shaders
                const shaderDefs = [{
                    vertex: 'vertex shader source',
                    fragment: 'fragment shader source',
                    complexity: 0.5
                }];
                shaderManager.registerShader('testShader', shaderDefs);
                
                // Trigger context loss
                loseContext.loseContext();
                
                // Wait for error recovery
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Verify managers have handled the failure
                expect(errorManager.getRecoveryHistory().length).toBeGreaterThan(0);
                expect(performanceManager.getMetrics()).toBeDefined();
                expect(shaderManager.useShader('testShader')).toBeNull();
                
                // Restore context
                loseContext.restoreContext();
                
                // Wait for recovery
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Verify system has recovered
                expect(shaderManager.useShader('testShader')).toBeDefined();
                expect(contextManager.getContext()).toBeDefined();
            }
        });
    });
}); 
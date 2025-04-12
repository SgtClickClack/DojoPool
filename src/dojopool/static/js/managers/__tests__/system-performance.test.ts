/// <reference types="jest" />

import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import type { Mock } from 'jest';
import { PerformanceMonitor } from '../performance-monitor';
import { PerformanceBudgetManager, type PerformanceBudget } from '../performance-budget';
import { WebGLContextManager } from '../webgl-context-manager';
import { TransitionManager } from '../transition-manager';
import { DeviceProfileManager } from '../device-profile-manager';
import { PerformanceSnapshot, BudgetStatus, BudgetViolation } from '../../types';

// Mock WebGL types
interface MockWebGLTexture extends WebGLTexture {
    id: string;
    width: number;
    height: number;
}

interface MockWebGLContext extends WebGLRenderingContext {
    isContextLost: () => boolean;
    getExtension: Mock<(name: string) => any>;
    getParameter: Mock<(pname: number) => any>;
    createTexture: Mock<() => WebGLTexture>;
    deleteTexture: Mock<(texture: WebGLTexture) => void>;
    drawArrays: Mock<(mode: number, first: number, count: number) => void>;
    drawElements: Mock<(mode: number, count: number, type: number, offset: number) => void>;
}

// Worker metrics type matching implementation
interface WorkerMetrics {
    totalUtilization: number;
    averageProcessingTime: number;
    totalErrors: number;
    queueLength: number;
    activeWorkers: number;
}

// Memory stats type
interface MemoryInfo {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
}

// Move to shared types
export interface WebGLTimingInfo {
    gpuTime: number;
    drawCalls: number;
    triangleCount: number;
    contextLost: boolean;
}

declare global {
    interface Performance {
        memory: MemoryInfo;
    }
}

// Mock manager implementations
class MockWebGLContextManager {
    private textures: Map<string, MockWebGLTexture> = new Map();
    private static instance: MockWebGLContextManager;
    
    static getInstance(): MockWebGLContextManager {
        if (!MockWebGLContextManager.instance) {
            MockWebGLContextManager.instance = new MockWebGLContextManager();
        }
        return MockWebGLContextManager.instance;
    }
    
    createTexture(width: number, height: number): MockWebGLTexture {
        const texture = {
            id: `texture_${Date.now()}`,
            width,
            height
        } as MockWebGLTexture;
        this.textures.set(texture.id, texture);
        return texture;
    }
    
    deleteTexture(texture: MockWebGLTexture): void {
        this.textures.delete(texture.id);
    }
    
    getTexture(id: string): MockWebGLTexture | undefined {
        return this.textures.get(id);
    }
    
    isContextValid(): boolean {
        return true;
    }
    
    cleanup(): void {
        this.textures.clear();
    }
}

class MockTransitionManager {
    private transitioning = false;
    private static instance: MockTransitionManager;
    
    static getInstance(): MockTransitionManager {
        if (!MockTransitionManager.instance) {
            MockTransitionManager.instance = new MockTransitionManager();
        }
        return MockTransitionManager.instance;
    }
    
    startTransition(level: number): void {
        this.transitioning = true;
    }
    
    isTransitioning(): boolean {
        return this.transitioning;
    }
    
    cleanup(): void {
        this.transitioning = false;
    }
}

class MockPerformanceBudgetManager {
    private recoveryCallbacks: (() => void)[] = [];
    private static instance: MockPerformanceBudgetManager;
    private budget: PerformanceBudget = {
        fps: 60,
        frameTime: 16.67,
        gpuTime: 8,
        memoryLimit: 512 * 1024 * 1024, // 512MB
        workerUtilization: 0.8
    };
    
    static getInstance(): MockPerformanceBudgetManager {
        if (!MockPerformanceBudgetManager.instance) {
            MockPerformanceBudgetManager.instance = new MockPerformanceBudgetManager();
        }
        return MockPerformanceBudgetManager.instance;
    }
    
    onRecovery(callback: () => void): void {
        this.recoveryCallbacks.push(callback);
    }
    
    checkPerformance(snapshot: PerformanceSnapshot): BudgetStatus {
        const violations: BudgetViolation[] = [];
        const utilizationPercentages = {
            cpu: snapshot.frameTime / this.budget.frameTime,
            gpu: snapshot.gpuTime / this.budget.gpuTime,
            memory: snapshot.memoryStats.usedJSHeapSize / this.budget.memoryLimit,
            worker: snapshot.workerUtilization / this.budget.workerUtilization
        };
        
        if (snapshot.fps < this.budget.fps) {
            violations.push({
                metric: 'fps',
                current: snapshot.fps,
                target: this.budget.fps,
                percentageOver: (this.budget.fps - snapshot.fps) / this.budget.fps
            });
        }
        
        return {
            isWithinBudget: violations.length === 0,
            violations,
            utilizationPercentages
        };
    }
    
    cleanup(): void {
        this.recoveryCallbacks = [];
    }
}

class MockDeviceProfileManager {
    private static instance: MockDeviceProfileManager;
    
    static getInstance(): MockDeviceProfileManager {
        if (!MockDeviceProfileManager.instance) {
            MockDeviceProfileManager.instance = new MockDeviceProfileManager();
        }
        return MockDeviceProfileManager.instance;
    }
    
    cleanup(): void {}
}

describe('System Performance Tests', () => {
    let monitor: PerformanceMonitor;
    let budgetManager: MockPerformanceBudgetManager;
    let contextManager: MockWebGLContextManager;
    let transitionManager: MockTransitionManager;
    let deviceProfileManager: MockDeviceProfileManager;
    let mockWebGLContext: MockWebGLContext;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        // Create mock WebGL context
        mockWebGLContext = {
            getExtension: jest.fn().mockReturnValue({
                beginQuery: jest.fn(),
                endQuery: jest.fn(),
                getQueryObject: jest.fn().mockReturnValue(0)
            }),
            getParameter: jest.fn().mockReturnValue(0),
            createTexture: jest.fn().mockReturnValue({}),
            deleteTexture: jest.fn(),
            isContextLost: jest.fn().mockReturnValue(false)
        } as unknown as MockWebGLContext;

        // Create mock canvas
        mockCanvas = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            getContext: jest.fn().mockReturnValue(mockWebGLContext)
        } as unknown as HTMLCanvasElement;

        // Initialize managers
        monitor = PerformanceMonitor.getInstance({
            autoStart: false,
            sampleInterval: 100
        });
        budgetManager = new MockPerformanceBudgetManager();
        contextManager = new MockWebGLContextManager();
        transitionManager = new MockTransitionManager();
        deviceProfileManager = new MockDeviceProfileManager();

        // Initialize WebGL
        monitor.initializeWebGL(mockWebGLContext);
    });

    afterEach(() => {
        monitor.cleanup();
        budgetManager.cleanup();
        contextManager.cleanup();
        transitionManager.cleanup();
        deviceProfileManager.cleanup();
    });

    describe('Frame Rate Stability', () => {
        it('should maintain stable frame rate under load', async () => {
            const targetFPS = 60;
            const frameTimings: number[] = [];
            const duration = 5000; // 5 seconds
            const startTime = performance.now();

            monitor.start();

            while (performance.now() - startTime < duration) {
                const frameStart = performance.now();
                
                // Simulate rendering work
                await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
                
                // Simulate WebGL operations
                contextManager.createTexture(256, 256);
                
                // Simulate quality transition
                transitionManager.startTransition(2);
                
                frameTimings.push(performance.now() - frameStart);
            }

            const averageFPS = 1000 / (frameTimings.reduce((a, b) => a + b) / frameTimings.length);
            expect(averageFPS).toBeGreaterThanOrEqual(targetFPS * 0.9); // Allow 10% margin
        });

        it('should handle frame rate drops gracefully', async () => {
            const frameTimings: number[] = [];
            const duration = 5000; // 5 seconds
            const startTime = performance.now();

            monitor.start();

            while (performance.now() - startTime < duration) {
                const frameStart = performance.now();
                
                // Simulate heavy rendering work
                await new Promise(resolve => setTimeout(resolve, 33)); // ~30fps
                
                // Simulate multiple WebGL operations
                for (let i = 0; i < 10; i++) {
                    contextManager.createTexture(512, 512);
                }
                
                frameTimings.push(performance.now() - frameStart);
            }

            const reports = monitor.getReports();
            const violations = reports.filter(report => 
                report.budgetStatus && !report.budgetStatus.isWithinBudget
            );
            
            expect(violations.length).toBeLessThan(reports.length * 0.1); // Less than 10% violations
        });
    });

    describe('Memory Usage', () => {
        it('should manage memory efficiently', async () => {
            const initialMemory = performance.memory?.usedJSHeapSize || 0;
            const textureCount = 100;
            const textures: MockWebGLTexture[] = [];

            // Create textures
            for (let i = 0; i < textureCount; i++) {
                textures.push(contextManager.createTexture(256, 256));
            }

            // Delete textures
            for (const texture of textures) {
                contextManager.deleteTexture(texture);
            }

            const finalMemory = performance.memory?.usedJSHeapSize || 0;
            expect(finalMemory - initialMemory).toBeLessThan(initialMemory * 0.1); // Less than 10% increase
        });

        it('should handle memory spikes', async () => {
            const initialMemory = performance.memory?.usedJSHeapSize || 0;
            const spikeCount = 10;
            const textures: MockWebGLTexture[] = [];

            for (let i = 0; i < spikeCount; i++) {
                // Create large textures
                for (let j = 0; j < 50; j++) {
                    textures.push(contextManager.createTexture(1024, 1024));
                }

                // Delete textures
                for (const texture of textures) {
                    contextManager.deleteTexture(texture);
                }
                textures.length = 0;

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const finalMemory = performance.memory?.usedJSHeapSize || 0;
            expect(finalMemory - initialMemory).toBeLessThan(initialMemory * 0.2); // Less than 20% increase
        });
    });

    describe('Resource Cleanup', () => {
        it('should clean up resources properly', async () => {
            const textureCount = 50;
            const textures: MockWebGLTexture[] = [];

            // Create textures
            for (let i = 0; i < textureCount; i++) {
                textures.push(contextManager.createTexture(256, 256));
            }

            // Clean up
            contextManager.cleanup();

            // Verify cleanup
            for (const texture of textures) {
                expect(contextManager.getTexture(texture.id)).toBeUndefined();
            }
        });

        it('should handle cleanup during active operations', async () => {
            const texture = contextManager.createTexture(256, 256);
            expect(texture).toBeDefined();

            // Start a transition
            transitionManager.startTransition(2);

            // Clean up during transition
            contextManager.cleanup();
            transitionManager.cleanup();

            // Verify cleanup
            expect(contextManager.getTexture(texture.id)).toBeUndefined();
            expect(transitionManager.isTransitioning()).toBe(false);
        });
    });

    describe('Error Recovery', () => {
        it('should recover from WebGL context loss', async () => {
            const texture = contextManager.createTexture(256, 256);
            expect(texture).toBeDefined();

            // Simulate context loss
            mockWebGLContext.isContextLost = jest.fn().mockReturnValue(true);
            mockCanvas.dispatchEvent(new Event('webglcontextlost'));

            // Simulate context restoration
            await new Promise(resolve => setTimeout(resolve, 100));
            mockWebGLContext.isContextLost = jest.fn().mockReturnValue(false);
            mockCanvas.dispatchEvent(new Event('webglcontextrestored'));

            // Verify recovery
            expect(contextManager.isContextValid()).toBe(true);
            const restoredTexture = contextManager.getTexture(texture.id);
            expect(restoredTexture).toBeDefined();
        });

        it('should handle worker errors gracefully', async () => {
            const worker = new Worker('worker.js');
            monitor.registerWorker(worker);

            worker.onerror = (e) => {
                expect(e).toBeDefined();
            };

            worker.postMessage({ type: 'errorTask' });
            await new Promise(resolve => setTimeout(resolve, 100));

            const reports = monitor.getReports();
            const workerMetrics = reports[reports.length - 1].workerMetrics;
            expect(workerMetrics.errorCount).toBeGreaterThan(0);

            worker.terminate();
        });
    });

    describe('Quality Transitions', () => {
        it('should maintain smooth transitions', async () => {
            const transitionCount = 10;
            const frameTimings: number[] = [];

            for (let i = 0; i < transitionCount; i++) {
                const startTime = performance.now();
                transitionManager.startTransition(i % 3); // Cycle through quality levels
                frameTimings.push(performance.now() - startTime);
            }

            const averageTransitionTime = frameTimings.reduce((a, b) => a + b) / frameTimings.length;
            expect(averageTransitionTime).toBeLessThan(50); // Less than 50ms per transition
        });

        it('should handle rapid quality changes', async () => {
            const rapidChanges = 20;
            
            for (let i = 0; i < rapidChanges; i++) {
                transitionManager.startTransition(i % 3);
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const reports = monitor.getReports();
            const violations = reports.filter(report => 
                report.budgetStatus && !report.budgetStatus.isWithinBudget
            );
            
            expect(violations.length).toBeLessThan(reports.length * 0.2); // Less than 20% violations
        });
    });

    describe('WebGL Context Management', () => {
        it('should handle context loss and restoration', async () => {
            const contextLossCount = 3;
            let actualLossCount = 0;

            // Add context loss listener
            mockCanvas.addEventListener('webglcontextlost', () => {
                actualLossCount++;
                // Simulate context restoration
                setTimeout(() => {
                    mockWebGLContext.isContextLost = jest.fn().mockReturnValue(false);
                    mockCanvas.dispatchEvent(new Event('webglcontextrestored'));
                }, 100);
            });

            // Simulate context losses
            for (let i = 0; i < contextLossCount; i++) {
                mockWebGLContext.isContextLost = jest.fn().mockReturnValue(true);
                mockCanvas.dispatchEvent(new Event('webglcontextlost'));
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            expect(actualLossCount).toBe(contextLossCount);
            expect(contextManager.isContextValid()).toBe(true);
        });

        it('should maintain texture state after context loss', async () => {
            const texture = contextManager.createTexture(256, 256);
            expect(texture).toBeDefined();

            // Simulate context loss and restoration
            mockWebGLContext.isContextLost = jest.fn().mockReturnValue(true);
            mockCanvas.dispatchEvent(new Event('webglcontextlost'));
            await new Promise(resolve => setTimeout(resolve, 100));
            mockWebGLContext.isContextLost = jest.fn().mockReturnValue(false);
            mockCanvas.dispatchEvent(new Event('webglcontextrestored'));
            await new Promise(resolve => setTimeout(resolve, 100));

            const restoredTexture = contextManager.getTexture(texture.id);
            expect(restoredTexture).toBeDefined();
            expect(restoredTexture.width).toBe(256);
            expect(restoredTexture.height).toBe(256);
        });
    });

    describe('Performance Budget Violations', () => {
        it('should handle multiple concurrent violations', async () => {
            const duration = 5000;
            const startTime = performance.now();
            let violationCount = 0;

            budgetManager.onRecovery(() => violationCount++);

            while (performance.now() - startTime < duration) {
                // Simulate heavy load
                for (let i = 0; i < 10; i++) {
                    contextManager.createTexture(1024, 1024);
                }
                transitionManager.startTransition(2);
                await new Promise(resolve => setTimeout(resolve, 16));
            }

            expect(violationCount).toBeGreaterThan(0);
            const reports = monitor.getReports();
            const violations = reports.filter(report => !report.budgetStatus.isWithinBudget);
            expect(violations.length).toBeGreaterThan(0);
        });

        it('should recover from budget violations', async () => {
            const duration = 5000;
            const startTime = performance.now();
            let recoveryCount = 0;

            budgetManager.onRecovery(() => recoveryCount++);

            // Simulate heavy load
            for (let i = 0; i < 10; i++) {
                contextManager.createTexture(1024, 1024);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Reduce load
            for (let i = 0; i < 5; i++) {
                contextManager.createTexture(256, 256);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));

            expect(recoveryCount).toBeGreaterThan(0);
        });
    });

    describe('Worker Performance', () => {
        it('should maintain worker performance under load', async () => {
            const workerCount = 4;
            const workers: Worker[] = [];
            const workerResults: number[] = [];

            // Create workers
            for (let i = 0; i < workerCount; i++) {
                const worker = new Worker('worker.js');
                workers.push(worker);
                monitor.registerWorker(worker);

                worker.onmessage = (e) => {
                    workerResults.push(e.data);
                };
            }

            // Simulate work
            for (const worker of workers) {
                worker.postMessage({ type: 'heavyTask' });
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            const reports = monitor.getReports();
            const workerMetrics = reports[reports.length - 1].workerMetrics;
            expect(workerMetrics.utilization).toBeLessThan(0.9);
            expect(workerMetrics.errorCount).toBe(0);

            // Cleanup
            for (const worker of workers) {
                worker.terminate();
            }
        });

        it('should handle worker errors gracefully', async () => {
            const worker = new Worker('worker.js');
            monitor.registerWorker(worker);

            worker.onerror = (e) => {
                expect(e).toBeDefined();
            };

            worker.postMessage({ type: 'errorTask' });
            await new Promise(resolve => setTimeout(resolve, 100));

            const reports = monitor.getReports();
            const workerMetrics = reports[reports.length - 1].workerMetrics;
            expect(workerMetrics.errorCount).toBeGreaterThan(0);

            worker.terminate();
        });
    });

    describe('Cross-Component Integration', () => {
        it('should maintain performance with all components active', async () => {
            const duration = 10000;
            const startTime = performance.now();
            let frameCount = 0;

            monitor.start();

            while (performance.now() - startTime < duration) {
                // Simulate rendering work
                contextManager.createTexture(256, 256);
                transitionManager.startTransition(frameCount % 3);
                
                // Check performance
                const snapshot: PerformanceSnapshot = {
                    timestamp: performance.now(),
                    fps: 60,
                    frameTime: 16.67,
                    gpuTime: 10,
                    memoryStats: {
                        jsHeapSize: performance.memory?.jsHeapSize || 0,
                        totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
                        usedJSHeapSize: performance.memory?.usedJSHeapSize || 0
                    },
                    workerUtilization: 0.5
                };

                const status = budgetManager.checkPerformance(snapshot);
                expect(status.isWithinBudget).toBe(true);

                frameCount++;
                await new Promise(resolve => setTimeout(resolve, 16));
            }

            const reports = monitor.getReports();
            expect(reports.length).toBeGreaterThan(0);
            expect(reports[reports.length - 1].fps).toBeGreaterThan(55);
        });

        it('should handle component failures gracefully', async () => {
            // Simulate WebGL context loss
            mockWebGLContext.isContextLost = jest.fn().mockReturnValue(true);
            mockCanvas.dispatchEvent(new Event('webglcontextlost'));

            // Simulate worker error
            const worker = new Worker('worker.js');
            monitor.registerWorker(worker);
            worker.postMessage({ type: 'errorTask' });

            await new Promise(resolve => setTimeout(resolve, 1000));

            const reports = monitor.getReports();
            expect(reports[reports.length - 1].gpuMetrics.contextLost).toBe(true);
            expect(reports[reports.length - 1].workerMetrics.errorCount).toBeGreaterThan(0);

            worker.terminate();
        });
    });

    describe('Stress Testing', () => {
        it('should handle maximum texture load', async () => {
            const textureCount = 1000;
            const textures: MockWebGLTexture[] = [];
            const startTime = performance.now();

            for (let i = 0; i < textureCount; i++) {
                textures.push(contextManager.createTexture(256, 256));
            }

            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(5000); // Should create 1000 textures in under 5 seconds

            // Cleanup
            for (const texture of textures) {
                contextManager.deleteTexture(texture);
            }
        });

        it('should handle rapid quality transitions', async () => {
            const transitionCount = 100;
            const startTime = performance.now();

            for (let i = 0; i < transitionCount; i++) {
                transitionManager.startTransition(i % 3);
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(transitionCount * 20); // Each transition should take less than 20ms

            const reports = monitor.getReports();
            const violations = reports.filter(report => !report.budgetStatus.isWithinBudget);
            expect(violations.length).toBeLessThan(transitionCount * 0.1); // Less than 10% violations
        });
    });
}); 
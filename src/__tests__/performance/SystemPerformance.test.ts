import { WebGLContextManager } from '../../services/WebGLContextManager';
import { ShaderManager } from '../../services/ShaderManager';
import { TextureManager } from '../../services/TextureManager';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';
import { createMockCanvas, createMockWebGLContext } from '../test-utils/webgl-mocks';

describe('System Performance Tests', () => {
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext;
  let contextManager: WebGLContextManager;
  let shaderManager: ShaderManager;
  let textureManager: TextureManager;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    canvas = createMockCanvas();
    gl = createMockWebGLContext();
    contextManager = new WebGLContextManager(canvas);
    shaderManager = new ShaderManager(gl);
    textureManager = new TextureManager(gl);
    performanceMonitor = new PerformanceMonitor();
  });

  describe('Frame Rate Stability', () => {
    test('should maintain stable frame rate under load', async () => {
      const frameRates: number[] = [];
      
      // Simulate 100 frames
      for (let i = 0; i < 100; i++) {
        performanceMonitor.beginFrame();
        
        // Simulate typical frame workload
        contextManager.beginFrame();
        shaderManager.bindShaders();
        textureManager.updateTextures();
        contextManager.endFrame();
        
        performanceMonitor.endFrame();
        frameRates.push(performanceMonitor.getCurrentFPS());
        
        // Simulate frame timing
        await new Promise(resolve => setTimeout(resolve, 16)); // Target 60fps
      }
      
      const avgFPS = frameRates.reduce((a, b) => a + b) / frameRates.length;
      const variance = Math.sqrt(
        frameRates.reduce((a, b) => a + Math.pow(b - avgFPS, 2), 0) / frameRates.length
      );
      
      expect(avgFPS).toBeGreaterThan(55); // Allow for small variations
      expect(variance).toBeLessThan(5); // Ensure stable frame rate
    });
  });

  describe('Memory Usage', () => {
    test('should maintain stable memory usage', () => {
      const memorySnapshots: number[] = [];
      
      // Create and destroy resources repeatedly
      for (let i = 0; i < 50; i++) {
        // Create resources
        const shader = shaderManager.createShader('test');
        const texture = textureManager.createTexture('test');
        
        memorySnapshots.push(performanceMonitor.getMemoryUsage());
        
        // Cleanup resources
        shader.delete();
        texture.delete();
      }
      
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      
      expect(maxMemory - minMemory).toBeLessThan(1024 * 1024); // Less than 1MB variation
    });
  });

  describe('Resource Cleanup', () => {
    test('should properly clean up resources', () => {
      const resources = new Set();
      
      // Create resources
      for (let i = 0; i < 100; i++) {
        resources.add(shaderManager.createShader(`shader${i}`));
        resources.add(textureManager.createTexture(`texture${i}`));
      }
      
      // Clean up resources
      resources.forEach(resource => resource.delete());
      
      expect(performanceMonitor.getResourceCount()).toBe(0);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from context loss', async () => {
      const onRecovery = jest.fn();
      contextManager.onContextRestore(onRecovery);
      
      // Simulate context loss
      canvas.dispatchEvent(new Event('webglcontextlost'));
      
      // Simulate context restore
      canvas.dispatchEvent(new Event('webglcontextrestored'));
      
      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(onRecovery).toHaveBeenCalled();
      expect(contextManager.isContextLost()).toBeFalsy();
    });
  });

  describe('Quality Transitions', () => {
    test('should smoothly transition quality levels', () => {
      const qualityLevels = ['high', 'medium', 'low'];
      const transitionTimes: number[] = [];
      
      qualityLevels.forEach(quality => {
        performanceMonitor.beginTransition();
        shaderManager.setQuality(quality);
        textureManager.setQuality(quality);
        performanceMonitor.endTransition();
        
        transitionTimes.push(performanceMonitor.getLastTransitionTime());
      });
      
      transitionTimes.forEach(time => {
        expect(time).toBeLessThan(100); // Transitions should take less than 100ms
      });
    });
  });
}); 
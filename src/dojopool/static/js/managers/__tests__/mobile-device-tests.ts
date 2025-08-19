import { DeviceProfileManager } from '../device-profile-manager';
import { WebGLContextManager } from '../webgl-context-manager';

describe('Mobile Device Testing', () => {
  let canvas: HTMLCanvasElement;
  let deviceProfileManager: DeviceProfileManager;
  let contextManager: WebGLContextManager;

  const mockMobileDevices = [
    {
      name: 'Low-end Android',
      userAgent: 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G530H)',
      memory: 2,
      cores: 4,
    },
    {
      name: 'Mid-range iPhone',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X)',
      memory: 4,
      cores: 6,
    },
    {
      name: 'High-end iPad',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X)',
      memory: 6,
      cores: 8,
    },
  ];

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  afterEach(() => {
    if (contextManager) {
      contextManager.cleanup();
    }
  });

  describe('Device Profile Tests', () => {
    mockMobileDevices.forEach((device) => {
      describe(`${device.name} Profile`, () => {
        beforeEach(() => {
          Object.defineProperty(navigator, 'userAgent', {
            value: device.userAgent,
            configurable: true,
          });
          Object.defineProperty(navigator, 'deviceMemory', {
            value: device.memory,
            configurable: true,
          });
          Object.defineProperty(navigator, 'hardwareConcurrency', {
            value: device.cores,
            configurable: true,
          });
        });

        it('should generate appropriate performance profile', () => {
          deviceProfileManager = DeviceProfileManager.getInstance();
          const profile = deviceProfileManager.getProfile();

          if (device.memory <= 2) {
            expect(profile.qualityLevel).toBe(0.3);
            expect(profile.targetFPS).toBe(30);
          } else if (device.memory <= 4) {
            expect(profile.qualityLevel).toBeLessThanOrEqual(0.5);
            expect(profile.targetFPS).toBeLessThanOrEqual(45);
          } else {
            expect(profile.qualityLevel).toBeLessThanOrEqual(0.7);
            expect(profile.targetFPS).toBeLessThanOrEqual(60);
          }
        });
      });
    });
  });

  describe('WebGL Context Tests', () => {
    mockMobileDevices.forEach((device) => {
      describe(`${device.name} Context Management`, () => {
        beforeEach(() => {
          Object.defineProperty(navigator, 'userAgent', {
            value: device.userAgent,
            configurable: true,
          });
        });

        it('should handle context loss gracefully', async () => {
          contextManager = WebGLContextManager.getInstance({ canvas });
          const contextLostSpy = jest.fn();
          const contextRestoredSpy = jest.fn();

          contextManager.onContextLost(contextLostSpy);
          contextManager.onContextRestored(contextRestoredSpy);

          // Simulate context loss
          canvas.dispatchEvent(new Event('webglcontextlost'));
          expect(contextLostSpy).toHaveBeenCalled();

          // Wait for recovery attempt
          await new Promise((resolve) => setTimeout(resolve, 1100));

          // Simulate context restoration
          canvas.dispatchEvent(new Event('webglcontextrestored'));
          expect(contextRestoredSpy).toHaveBeenCalled();
        });

        it('should reduce quality after multiple context losses', async () => {
          contextManager = WebGLContextManager.getInstance({ canvas });
          const profile = DeviceProfileManager.getInstance().getProfile();
          const initialQuality = profile.qualityLevel;

          // Simulate multiple context losses
          for (let i = 0; i < 3; i++) {
            canvas.dispatchEvent(new Event('webglcontextlost'));
            await new Promise((resolve) => setTimeout(resolve, 1100));
          }

          const newProfile = DeviceProfileManager.getInstance().getProfile();
          expect(newProfile.qualityLevel).toBeLessThan(initialQuality);
        });
      });
    });
  });

  describe('Performance Tests', () => {
    mockMobileDevices.forEach((device) => {
      describe(`${device.name} Performance`, () => {
        beforeEach(() => {
          Object.defineProperty(navigator, 'userAgent', {
            value: device.userAgent,
            configurable: true,
          });
        });

        it('should maintain target FPS under load', async () => {
          contextManager = WebGLContextManager.getInstance({ canvas });
          const profile = DeviceProfileManager.getInstance().getProfile();
          const targetFPS = profile.targetFPS;
          const frameTimings: number[] = [];

          // Simulate 60 frames of rendering
          for (let i = 0; i < 60; i++) {
            const startTime = performance.now();
            // Simulate rendering work
            await new Promise((resolve) => setTimeout(resolve, 16)); // ~60fps
            frameTimings.push(performance.now() - startTime);
          }

          const averageFPS =
            1000 / (frameTimings.reduce((a, b) => a + b) / frameTimings.length);
          expect(averageFPS).toBeGreaterThanOrEqual(targetFPS * 0.9); // Allow 10% margin
        });

        it('should handle texture memory limits', () => {
          contextManager = WebGLContextManager.getInstance({ canvas });
          const gl = contextManager.getContext();
          const profile = DeviceProfileManager.getInstance().getProfile();

          // Test texture creation within limits
          const maxSize = Math.min(
            profile.textureQuality * gl.getParameter(gl.MAX_TEXTURE_SIZE),
            2048
          );
          const texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);

          // Should not throw error
          expect(() => {
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              maxSize,
              maxSize,
              0,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              null
            );
          }).not.toThrow();
        });
      });
    });
  });
});

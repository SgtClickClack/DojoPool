import {
  calculateTrajectory,
  applyFriction,
  detectCollision,
} from "../../utils/physics";
import { measurePerformance, measureFrameRate } from "../../utils/performance";

describe("Game Performance Tests", () => {
  const PERFORMANCE_THRESHOLD = 50; // 50ms threshold

  describe("Physics Calculations", () => {
    it("calculates trajectories within performance threshold", async () => {
      const result = await measurePerformance(
        () => {
          // Simulate 1000 trajectory calculations
          for (let i = 0; i < 1000; i++) {
            calculateTrajectory(
              { x: Math.random() * 100, y: Math.random() * 100 },
              Math.random() * 100,
              Math.random() * 360,
            );
          }
        },
        { 
          markName: 'trajectory', 
          measureName: 'trajectory',
          collectMeasures: true 
        }
      );

      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLD);
    });

    it("applies friction calculations within performance threshold", async () => {
      const result = await measurePerformance(
        () => {
          // Simulate 1000 friction calculations
          for (let i = 0; i < 1000; i++) {
            applyFriction(
              { x: Math.random() * 10, y: Math.random() * 10 },
              0.1,
              0.016, // 60fps frame time
            );
          }
        },
        { 
          markName: 'friction', 
          measureName: 'friction',
          collectMeasures: true 
        }
      );

      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLD);
    });

    it("handles multiple collision detections efficiently", async () => {
      const result = await measurePerformance(
        () => {
          // Simulate 1000 collision checks
          for (let i = 0; i < 1000; i++) {
            detectCollision(
              { x: Math.random() * 100, y: Math.random() * 100, radius: 5 },
              { x: Math.random() * 100, y: Math.random() * 100, radius: 5 },
            );
          }
        },
        { 
          markName: 'collision', 
          measureName: 'collision',
          collectMeasures: true 
        }
      );

      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLD);
    });
  });

  describe("Game State Updates", () => {
    it("handles rapid state updates efficiently", async () => {
      const gameState = {
        balls: Array.from({ length: 16 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          velocity: { x: Math.random() * 10, y: Math.random() * 10 },
        })),
      };

      const result = await measureFrameRate(
        () => {
          // Simulate 60 frames of physics updates
          gameState.balls.forEach((ball) => {
            // Apply physics updates
            ball.x += ball.velocity.x * 0.016;
            ball.y += ball.velocity.y * 0.016;
            ball.velocity = applyFriction(ball.velocity, 0.1, 0.016);

            // Check collisions with other balls
            gameState.balls.forEach((otherBall) => {
              if (ball.id !== otherBall.id) {
                detectCollision(
                  { x: ball.x, y: ball.y, radius: 5 },
                  { x: otherBall.x, y: otherBall.y, radius: 5 },
                );
              }
            });
          });
        },
        { 
          duration: 1000, // 1 second of simulation
          markName: 'stateUpdate', 
          measureName: 'stateUpdate' 
        }
      );

      expect(result.fps).toBeGreaterThanOrEqual(60);
      expect(result.droppedFrames).toBeLessThan(5); // Allow max 5 frame drops
    });
  });

  describe("Memory Usage", () => {
    it("maintains stable memory usage during game simulation", async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const gameStates: any[] = [];

      const result = await measurePerformance(
        () => {
          // Simulate storing 1000 game states
          for (let i = 0; i < 1000; i++) {
            gameStates.push({
              balls: Array.from({ length: 16 }, (_, j) => ({
                id: j,
                x: Math.random() * 100,
                y: Math.random() * 100,
                velocity: { x: Math.random() * 10, y: Math.random() * 10 },
              })),
              timestamp: Date.now(),
              score: Math.floor(Math.random() * 100),
            });
          }
        },
        { 
          markName: 'memory', 
          measureName: 'memory',
          collectMemory: true,
          collectMeasures: true 
        }
      );

      const memoryIncrease = (result.memoryUsage?.max || 0) - initialMemory;
      expect(memoryIncrease / 1024 / 1024).toBeLessThan(50); // Less than 50MB increase

      // Cleanup
      gameStates.length = 0;
    });
  });
});

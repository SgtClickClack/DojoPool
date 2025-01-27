import { calculateTrajectory, applyFriction, detectCollision } from '../../utils/physics';
import { performance } from 'perf_hooks';

describe('Game Performance Tests', () => {
  const PERFORMANCE_THRESHOLD = 50; // 50ms threshold

  describe('Physics Calculations', () => {
    it('calculates trajectories within performance threshold', () => {
      const start = performance.now();
      
      // Simulate 1000 trajectory calculations
      for (let i = 0; i < 1000; i++) {
        calculateTrajectory(
          { x: Math.random() * 100, y: Math.random() * 100 },
          Math.random() * 100,
          Math.random() * 360
        );
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
    });

    it('applies friction calculations within performance threshold', () => {
      const start = performance.now();
      
      // Simulate 1000 friction calculations
      for (let i = 0; i < 1000; i++) {
        applyFriction(
          { x: Math.random() * 10, y: Math.random() * 10 },
          0.1,
          0.016 // 60fps frame time
        );
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
    });

    it('handles multiple collision detections efficiently', () => {
      const start = performance.now();
      
      // Simulate 1000 collision checks
      for (let i = 0; i < 1000; i++) {
        detectCollision(
          { x: Math.random() * 100, y: Math.random() * 100, radius: 5 },
          { x: Math.random() * 100, y: Math.random() * 100, radius: 5 }
        );
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
    });
  });

  describe('Game State Updates', () => {
    it('handles rapid state updates efficiently', () => {
      const gameState = {
        balls: Array.from({ length: 16 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          velocity: { x: Math.random() * 10, y: Math.random() * 10 },
        })),
      };

      const start = performance.now();
      
      // Simulate 60 frames of physics updates
      for (let frame = 0; frame < 60; frame++) {
        gameState.balls.forEach(ball => {
          // Apply physics updates
          ball.x += ball.velocity.x * 0.016;
          ball.y += ball.velocity.y * 0.016;
          ball.velocity = applyFriction(ball.velocity, 0.1, 0.016);
          
          // Check collisions with other balls
          gameState.balls.forEach(otherBall => {
            if (ball.id !== otherBall.id) {
              detectCollision(
                { x: ball.x, y: ball.y, radius: 5 },
                { x: otherBall.x, y: otherBall.y, radius: 5 }
              );
            }
          });
        });
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD * 2); // Allow more time for complex updates
    });
  });

  describe('Memory Usage', () => {
    it('maintains stable memory usage during game simulation', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const gameStates: any[] = [];
      
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
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
      
      // Cleanup
      gameStates.length = 0;
    });
  });
}); 
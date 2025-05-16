import React from "react";
import { render, act } from "@testing-library/react";
import { GameBoard } from "../game/GameBoard";
import { performance } from "perf_hooks";

describe("GameBoard Performance", () => {
  const RENDER_THRESHOLD = 50; // 50ms threshold
  const UPDATE_THRESHOLD = 16; // 16ms for 60fps

  it("renders initially within performance threshold", () => {
    const start = performance.now();

    render(<GameBoard />);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(RENDER_THRESHOLD);
  });

  it("handles rapid updates efficiently", async () => {
    const { rerender } = render(<GameBoard />);
    const updateTimes: number[] = [];

    // Simulate 60 frames of updates
    for (let i = 0; i < 60; i++) {
      const start = performance.now();

      await act(async () => {
        rerender(
          <GameBoard
            balls={Array.from({ length: 16 }, (_, j) => ({
              id: j,
              x: Math.random() * 100,
              y: Math.random() * 100,
              velocity: { x: Math.random() * 10, y: Math.random() * 10 },
            }))}
          />,
        );
      });

      updateTimes.push(performance.now() - start);
    }

    // Calculate average update time
    const averageUpdateTime =
      updateTimes.reduce((a, b) => a + b) / updateTimes.length;
    expect(averageUpdateTime).toBeLessThan(UPDATE_THRESHOLD);
  });

  it("maintains performance with many balls", () => {
    const start = performance.now();

    render(
      <GameBoard
        balls={Array.from({ length: 100 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          velocity: { x: Math.random() * 10, y: Math.random() * 10 },
        }))}
      />,
    );

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(RENDER_THRESHOLD * 2); // Allow more time for many balls
  });

  it("handles window resizing efficiently", async () => {
    const { container } = render(<GameBoard />);
    const resizeTimes: number[] = [];

    // Simulate multiple resize events
    for (let i = 0; i < 10; i++) {
      const start = performance.now();

      await act(async () => {
        // Trigger resize event
        window.dispatchEvent(new Event("resize"));
      });

      resizeTimes.push(performance.now() - start);
    }

    const averageResizeTime =
      resizeTimes.reduce((a, b) => a + b) / resizeTimes.length;
    expect(averageResizeTime).toBeLessThan(UPDATE_THRESHOLD);
  });

  it("maintains stable memory usage during updates", async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    const { rerender } = render(<GameBoard />);

    // Simulate many updates
    for (let i = 0; i < 1000; i++) {
      await act(async () => {
        rerender(
          <GameBoard
            balls={Array.from({ length: 16 }, (_, j) => ({
              id: j,
              x: Math.random() * 100,
              y: Math.random() * 100,
              velocity: { x: Math.random() * 10, y: Math.random() * 10 },
            }))}
          />,
        );
      });
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

    expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
  });
});

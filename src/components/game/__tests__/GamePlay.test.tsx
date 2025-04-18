import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { GamePlay } from "../GamePlay";
import { GameBoard } from "../GameBoard";
import { GameControls } from "../GameControls";

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  onmessage: null as any,
  onerror: null as any,
};

global.WebSocket = jest.fn(() => mockWebSocket as any);

// Mock fetch
global.fetch = jest.fn();

describe("Game Components", () => {
  const renderWithChakra = (component: React.ReactElement) => {
    return render(<ChakraProvider>{component}</ChakraProvider>);
  };

  describe("GameBoard", () => {
    const mockBalls = [
      { id: 0, x: 400, y: 300, color: "#FFFFFF", number: 0 },
      { id: 1, x: 600, y: 300, color: "#FFFF00", number: 1 },
    ];

    it("renders the pool table with balls", () => {
      renderWithChakra(
        <GameBoard
          width={800}
          height={400}
          balls={mockBalls}
          onBallClick={jest.fn()}
          onTableClick={jest.fn()}
        />,
      );

      // Check if the container is rendered
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("handles ball clicks", () => {
      const onBallClick = jest.fn();
      renderWithChakra(
        <GameBoard
          width={800}
          height={400}
          balls={mockBalls}
          onBallClick={onBallClick}
          onTableClick={jest.fn()}
        />,
      );

      // Simulate clicking on a ball
      fireEvent.click(screen.getByRole("img"));
      expect(onBallClick).toHaveBeenCalled();
    });
  });

  describe("GameControls", () => {
    it("renders controls when active", () => {
      renderWithChakra(
        <GameControls
          onShot={jest.fn()}
          isActive={true}
          onCancel={jest.fn()}
        />,
      );

      expect(screen.getByText("Shot Power")).toBeInTheDocument();
      expect(screen.getByText("Shot Angle")).toBeInTheDocument();
      expect(screen.getByText("Ball Spin")).toBeInTheDocument();
    });

    it("handles shot execution", async () => {
      const onShot = jest.fn();
      renderWithChakra(
        <GameControls onShot={onShot} isActive={true} onCancel={jest.fn()} />,
      );

      // Simulate charging and releasing shot
      const shotButton = screen.getByText("Take Shot");
      fireEvent.mouseDown(shotButton);
      await waitFor(() => {
        expect(screen.getByText("Charging...")).toBeInTheDocument();
      });
      fireEvent.mouseUp(shotButton);

      expect(onShot).toHaveBeenCalled();
    });
  });

  describe("GamePlay", () => {
    it("initializes game state", () => {
      renderWithChakra(<GamePlay gameId="test-game" />);

      expect(screen.getByText("Game Status: waiting")).toBeInTheDocument();
      expect(screen.getByText("Current Player: 1")).toBeInTheDocument();
    });

    it("handles game updates via WebSocket", async () => {
      renderWithChakra(<GamePlay gameId="test-game" />);

      // Simulate WebSocket message
      const update = {
        gameStatus: "in_progress",
        currentPlayer: 2,
      };
      mockWebSocket.onmessage({ data: JSON.stringify(update) });

      await waitFor(() => {
        expect(
          screen.getByText("Game Status: in_progress"),
        ).toBeInTheDocument();
        expect(screen.getByText("Current Player: 2")).toBeInTheDocument();
      });
    });

    it("switches to spectator mode", () => {
      renderWithChakra(<GamePlay gameId="test-game" isSpectator={true} />);

      // Check if spectator-specific elements are rendered
      expect(screen.queryByText("Take Shot")).not.toBeInTheDocument();
    });

    it("handles game end", async () => {
      const onGameEnd = jest.fn();
      renderWithChakra(<GamePlay gameId="test-game" onGameEnd={onGameEnd} />);

      // Simulate game end via WebSocket
      const update = {
        gameStatus: "finished",
        winner: 1,
      };
      mockWebSocket.onmessage({ data: JSON.stringify(update) });

      await waitFor(() => {
        expect(onGameEnd).toHaveBeenCalledWith(1);
      });
    });
  });
});

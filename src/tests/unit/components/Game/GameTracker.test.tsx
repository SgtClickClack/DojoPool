import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { GameTracker } from "../../../dojopool/frontend/components/Game/[GAME]GameTracker";
import { render } from "@testing-library/react";
import { useGameState } from "../../../dojopool/frontend/hooks/useGameState";

// Mock the useGameState hook
jest.mock("../../../dojopool/frontend/hooks/useGameState");

describe("GameTracker Component", () => {
  const mockUpdateBallStatus = jest.fn();
  const mockEndTurn = jest.fn();
  const mockEndGame = jest.fn();

  const mockGameState = {
    player1: {
      name: "Player 1",
      score: 50,
      ballsPocketed: [1, 3, 5],
    },
    player2: {
      name: "Player 2",
      score: 30,
      ballsPocketed: [2, 4],
    },
    ballStatuses: {
      1: "POCKETED",
      2: "POCKETED",
      3: "POCKETED",
      4: "POCKETED",
      5: "POCKETED",
    },
    currentTurn: "player1",
    isComplete: false,
  };

  beforeEach(() => {
    (useGameState as jest.Mock).mockReturnValue({
      gameState: mockGameState,
      updateBallStatus: mockUpdateBallStatus,
      endTurn: mockEndTurn,
      endGame: mockEndGame,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (useGameState as jest.Mock).mockReturnValue({
      gameState: null,
      updateBallStatus: mockUpdateBallStatus,
      endTurn: mockEndTurn,
      endGame: mockEndGame,
    });

    render(
      <GameTracker gameId="game123" player1Id="player1" player2Id="player2" />,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders game state when loaded", () => {
    render(
      <GameTracker gameId="game123" player1Id="player1" player2Id="player2" />,
    );

    // Check player information
    expect(screen.getByText("Player 1: Player 1")).toBeInTheDocument();
    expect(screen.getByText("Score: 50")).toBeInTheDocument();
    expect(screen.getByText("Balls Pocketed: 1, 3, 5")).toBeInTheDocument();

    expect(screen.getByText("Player 2: Player 2")).toBeInTheDocument();
    expect(screen.getByText("Score: 30")).toBeInTheDocument();
    expect(screen.getByText("Balls Pocketed: 2, 4")).toBeInTheDocument();
  });

  it("renders all ball buttons", () => {
    render(
      <GameTracker gameId="game123" player1Id="player1" player2Id="player2" />,
    );

    // Should have buttons 1-15
    for (let i = 1; i <= 15; i++) {
      expect(
        screen.getByRole("button", { name: i.toString() }),
      ).toBeInTheDocument();
    }
  });

  it("disables pocketed ball buttons", () => {
    render(
      <GameTracker gameId="game123" player1Id="player1" player2Id="player2" />,
    );

    // Balls 1-5 should be disabled (pocketed)
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole("button", { name: i.toString() })).toBeDisabled();
    }

    // Balls 6-15 should be enabled
    for (let i = 6; i <= 15; i++) {
      expect(screen.getByRole("button", { name: i.toString() })).toBeEnabled();
    }
  });

  it("calls updateBallStatus when clicking a ball button", () => {
    render(
      <GameTracker gameId="game123" player1Id="player1" player2Id="player2" />,
    );

    // Click ball 6 (not pocketed)
    fireEvent.click(screen.getByRole("button", { name: "6" }));
    expect(mockUpdateBallStatus).toHaveBeenCalledWith(6, "POCKETED");
  });

  it("calls endTurn when clicking End Turn button", () => {
    render(
      <GameTracker gameId="game123" player1Id="player1" player2Id="player2" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));
    expect(mockEndTurn).toHaveBeenCalled();
  });

  it("calls endGame when clicking End Game button", () => {
    render(
      <GameTracker gameId="game123" player1Id="player1" player2Id="player2" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "End Game" }));
    expect(mockEndGame).toHaveBeenCalled();
  });

  it("updates display when game state changes", async () => {
    const { rerender } = render(
      <GameTracker gameId="game123" player1Id="player1" player2Id="player2" />,
    );

    // Update game state
    const newGameState = {
      ...mockGameState,
      player1: {
        ...mockGameState.player1,
        score: 60,
        ballsPocketed: [...mockGameState.player1.ballsPocketed, 6],
      },
      ballStatuses: {
        ...mockGameState.ballStatuses,
        6: "POCKETED",
      },
    };

    (useGameState as jest.Mock).mockReturnValue({
      gameState: newGameState,
      updateBallStatus: mockUpdateBallStatus,
      endTurn: mockEndTurn,
      endGame: mockEndGame,
    });

    rerender(
      <GameTracker gameId="game123" player1Id="player1" player2Id="player2" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Score: 60")).toBeInTheDocument();
      expect(
        screen.getByText("Balls Pocketed: 1, 3, 5, 6"),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "6" })).toBeDisabled();
    });
  });
});

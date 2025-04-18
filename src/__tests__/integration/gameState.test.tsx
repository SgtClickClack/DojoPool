import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GameProvider } from "../../contexts/GameContext";
import { Game } from "../../components/Game";
import { act } from "react-dom/test-utils";

describe("Game State Management", () => {
  beforeEach(() => {
    render(
      <GameProvider>
        <Game />
      </GameProvider>,
    );
  });

  it("manages player turns correctly", async () => {
    // Start game
    fireEvent.click(screen.getByText(/start game/i));

    // Initial state
    expect(screen.getByText(/player 1's turn/i)).toBeInTheDocument();

    // Take shot
    await act(async () => {
      fireEvent.click(screen.getByTestId("shot-button"));
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for animations
    });

    // Verify turn switch
    expect(screen.getByText(/player 2's turn/i)).toBeInTheDocument();
  });

  it("handles game state persistence", async () => {
    // Start game and set up initial state
    fireEvent.click(screen.getByText(/start game/i));

    // Make some moves
    await act(async () => {
      fireEvent.click(screen.getByTestId("shot-button"));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    // Get current state
    const currentScore = screen.getByTestId("player-1-score").textContent;

    // Simulate page reload
    await act(async () => {
      render(
        <GameProvider>
          <Game />
        </GameProvider>,
      );
    });

    // Verify state persisted
    expect(screen.getByTestId("player-1-score")).toHaveTextContent(
      currentScore || "",
    );
  });

  it("manages game rules and scoring", async () => {
    fireEvent.click(screen.getByText(/start game/i));

    // Test legal shot
    await act(async () => {
      fireEvent.change(screen.getByTestId("power-slider"), {
        target: { value: "50" },
      });
      fireEvent.change(screen.getByTestId("angle-slider"), {
        target: { value: "45" },
      });
      fireEvent.click(screen.getByTestId("shot-button"));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    // Test foul detection
    const foulButton = screen.getByText(/call foul/i);
    fireEvent.click(foulButton);

    await waitFor(() => {
      expect(screen.getByText(/foul/i)).toBeInTheDocument();
    });
  });

  it("handles game completion scenarios", async () => {
    fireEvent.click(screen.getByText(/start game/i));

    // Simulate winning condition
    await act(async () => {
      // Simulate multiple successful shots
      for (let i = 0; i < 7; i++) {
        fireEvent.click(screen.getByTestId("shot-button"));
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    });

    // Verify game completion
    await waitFor(() => {
      expect(screen.getByTestId("game-winner")).toBeInTheDocument();
      expect(screen.getByText(/new game/i)).toBeInTheDocument();
    });
  });

  it("manages game settings and configuration", async () => {
    // Open settings
    fireEvent.click(screen.getByTestId("settings-button"));

    // Modify settings
    const difficultySelect = screen.getByTestId("difficulty-select");
    fireEvent.change(difficultySelect, { target: { value: "hard" } });

    // Start new game
    fireEvent.click(screen.getByText(/start game/i));

    // Verify settings applied
    expect(screen.getByTestId("game-difficulty")).toHaveTextContent(/hard/i);
  });
});

import React from "react";
import { screen } from "@testing-library/react";
import { GameStats } from "../../../dojopool/frontend/components/Game/[GAME]GameStats";
import { render } from "@testing-library/react";

describe("GameStats Component", () => {
  const mockStats = {
    totalShots: 50,
    successfulShots: 35,
    fouls: 3,
    longestStreak: 7,
    gameLength: 45,
  };

  it("renders player name in title", () => {
    render(<GameStats stats={mockStats} playerName="John Doe" />);

    expect(screen.getByText("John Doe's Game Statistics")).toBeInTheDocument();
  });

  it("calculates and displays accuracy correctly", () => {
    render(<GameStats stats={mockStats} playerName="John Doe" />);

    // 35/50 * 100 = 70.0%
    expect(screen.getByText("70.0%")).toBeInTheDocument();
  });

  it("displays all statistics correctly", () => {
    render(<GameStats stats={mockStats} playerName="John Doe" />);

    // Check all stat labels
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.getByText("Total Shots")).toBeInTheDocument();
    expect(screen.getByText("Successful Shots")).toBeInTheDocument();
    expect(screen.getByText("Fouls")).toBeInTheDocument();
    expect(screen.getByText("Longest Streak")).toBeInTheDocument();
    expect(screen.getByText("Game Length")).toBeInTheDocument();

    // Check all stat values
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();
  });

  it("handles perfect accuracy", () => {
    const perfectStats = {
      ...mockStats,
      totalShots: 20,
      successfulShots: 20,
    };

    render(<GameStats stats={perfectStats} playerName="John Doe" />);

    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });

  it("handles zero shots", () => {
    const zeroStats = {
      ...mockStats,
      totalShots: 0,
      successfulShots: 0,
    };

    render(<GameStats stats={zeroStats} playerName="John Doe" />);

    // 0/0 * 100 = NaN, should display as 0.0%
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("handles long player names", () => {
    const longName = "John Jacob Jingleheimer Schmidt III";

    render(<GameStats stats={mockStats} playerName={longName} />);

    expect(
      screen.getByText(`${longName}'s Game Statistics`),
    ).toBeInTheDocument();
  });

  it("handles large numbers", () => {
    const largeStats = {
      totalShots: 9999,
      successfulShots: 8888,
      fouls: 111,
      longestStreak: 50,
      gameLength: 180,
    };

    render(<GameStats stats={largeStats} playerName="John Doe" />);

    expect(screen.getByText("9999")).toBeInTheDocument();
    expect(screen.getByText("8888")).toBeInTheDocument();
    expect(screen.getByText("111")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("180 min")).toBeInTheDocument();
    expect(screen.getByText("88.9%")).toBeInTheDocument();
  });

  it("handles zero values for all stats", () => {
    const zeroStats = {
      totalShots: 0,
      successfulShots: 0,
      fouls: 0,
      longestStreak: 0,
      gameLength: 0,
    };

    render(<GameStats stats={zeroStats} playerName="John Doe" />);

    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(4); // All stats except accuracy and game length
    expect(screen.getByText("0 min")).toBeInTheDocument();
  });

  it("handles decimal values in game length", () => {
    const decimalStats = {
      ...mockStats,
      gameLength: 45.5,
    };

    render(<GameStats stats={decimalStats} playerName="John Doe" />);

    expect(screen.getByText("45.5 min")).toBeInTheDocument();
  });
});

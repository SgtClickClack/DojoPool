import React from "react";
import { screen } from "@testing-library/react";
import { GamePatterns } from "../../../dojopool/frontend/components/GameAnalysis/[GAME]GamePatterns";
import { renderWithProviders } from "../../utils/testUtils";

describe("GamePatterns Component", () => {
  const mockPatterns = {
    shot_distribution: {
      corner_shots: 25,
      bank_shots: 15,
      straight_shots: 60,
    },
    player_positioning: {
      left_side: 30,
      right_side: 40,
      center: 30,
    },
    common_sequences: [
      {
        description: "Break shot followed by corner pocket",
        frequency: 10,
        success_rate: 0.75,
      },
      {
        description: "Bank shot to side pocket",
        frequency: 8,
        success_rate: 0.6,
      },
      {
        description: "Cross-table combination",
        frequency: 5,
        success_rate: 0.45,
      },
    ],
    success_patterns: {
      break_pattern: "Strong break with controlled spread",
      positioning_strategy: "Maintain center table control",
      shot_selection: "Prioritize high percentage shots",
    },
  };

  it("renders all pattern sections", () => {
    renderWithProviders(<GamePatterns patterns={mockPatterns} />);

    // Check section headers
    expect(screen.getByText("Shot Distribution")).toBeInTheDocument();
    expect(screen.getByText("Player Positioning")).toBeInTheDocument();
    expect(screen.getByText("Common Sequences")).toBeInTheDocument();
    expect(screen.getByText("Success Patterns")).toBeInTheDocument();
  });

  it("displays shot distribution data", () => {
    renderWithProviders(<GamePatterns patterns={mockPatterns} />);

    expect(screen.getByText("Shot distribution heatmap")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Analysis of shot type frequencies and spatial distribution",
      ),
    ).toBeInTheDocument();
  });

  it("displays player positioning data", () => {
    renderWithProviders(<GamePatterns patterns={mockPatterns} />);

    expect(screen.getByText("Player positioning patterns")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Analysis of player movement and positioning strategies",
      ),
    ).toBeInTheDocument();
  });

  it("renders common sequences correctly", () => {
    renderWithProviders(<GamePatterns patterns={mockPatterns} />);

    mockPatterns.common_sequences.forEach((sequence, index) => {
      expect(screen.getByText(`Sequence ${index + 1}`)).toBeInTheDocument();
      expect(screen.getByText(sequence.description)).toBeInTheDocument();
    });
  });

  it("renders success patterns correctly", () => {
    renderWithProviders(<GamePatterns patterns={mockPatterns} />);

    Object.entries(mockPatterns.success_patterns).forEach(([key, value]) => {
      expect(
        screen.getByText(key.replace(/_/g, " ").toUpperCase()),
      ).toBeInTheDocument();
      expect(screen.getByText(value)).toBeInTheDocument();
    });
  });

  it("handles empty patterns data", () => {
    const emptyPatterns = {
      shot_distribution: {},
      player_positioning: {},
      common_sequences: [],
      success_patterns: {},
    };

    renderWithProviders(<GamePatterns patterns={emptyPatterns} />);

    expect(screen.getByText("Shot Distribution")).toBeInTheDocument();
    expect(screen.getByText("Player Positioning")).toBeInTheDocument();
    expect(screen.getByText("Common Sequences")).toBeInTheDocument();
    expect(screen.getByText("Success Patterns")).toBeInTheDocument();
  });

  it("handles null patterns prop", () => {
    renderWithProviders(<GamePatterns patterns={null} />);

    expect(screen.getByText("No pattern data available")).toBeInTheDocument();
  });

  it("handles long sequence descriptions", () => {
    const patternsWithLongDescriptions = {
      ...mockPatterns,
      common_sequences: [
        {
          description:
            "A very long and detailed description of a complex shot sequence that involves multiple balls and precise positioning on the table with specific angles and power levels",
          frequency: 10,
          success_rate: 0.75,
        },
      ],
    };

    renderWithProviders(
      <GamePatterns patterns={patternsWithLongDescriptions} />,
    );

    expect(
      screen.getByText(
        patternsWithLongDescriptions.common_sequences[0].description,
      ),
    ).toBeInTheDocument();
  });

  it("handles special characters in pattern names", () => {
    const patternsWithSpecialChars = {
      ...mockPatterns,
      success_patterns: {
        "special_pattern_@#$": "Pattern with special chars",
        pattern_123: "Numeric pattern name",
      },
    };

    renderWithProviders(<GamePatterns patterns={patternsWithSpecialChars} />);

    expect(screen.getByText("SPECIAL PATTERN @#$")).toBeInTheDocument();
    expect(screen.getByText("PATTERN 123")).toBeInTheDocument();
  });

  it("maintains consistent layout with varying content lengths", () => {
    const mixedLengthPatterns = {
      ...mockPatterns,
      common_sequences: [
        {
          description: "Short",
          frequency: 1,
          success_rate: 1,
        },
        {
          description:
            "A much longer sequence description that should still fit in the layout without breaking it",
          frequency: 2,
          success_rate: 0.5,
        },
      ],
      success_patterns: {
        short: "Brief",
        very_long_pattern_name:
          "A detailed explanation of the pattern that spans multiple lines potentially",
      },
    };

    renderWithProviders(<GamePatterns patterns={mixedLengthPatterns} />);

    expect(screen.getByText("Short")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A much longer sequence description that should still fit in the layout without breaking it",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("VERY LONG PATTERN NAME")).toBeInTheDocument();
  });
});

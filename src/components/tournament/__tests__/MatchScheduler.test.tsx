import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { MatchScheduler } from "../MatchScheduler";

const renderWithChakra = (component: React.ReactElement) => {
  return render(<ChakraProvider>{component}</ChakraProvider>);
};

const mockMatches = [
  {
    id: "1",
    round: 1,
    matchNumber: 1,
    player1: { id: "p1", name: "Player 1" },
    player2: { id: "p2", name: "Player 2" },
    status: "scheduled",
    startTime: "2024-01-16T10:00:00Z",
    duration: 30,
    tableNumber: 1,
  },
  {
    id: "2",
    round: 1,
    matchNumber: 2,
    player1: { id: "p3", name: "Player 3" },
    player2: { id: "p4", name: "Player 4" },
    status: "in_progress",
    startTime: "2024-01-16T11:00:00Z",
    duration: 30,
    tableNumber: 2,
  },
  {
    id: "3",
    round: 2,
    matchNumber: 1,
    player1: { id: "p1", name: "Player 1" },
    player2: { id: "p3", name: "Player 3" },
    status: "scheduled",
    duration: 30,
  },
];

const mockTables = [1, 2, 3, 4];

describe("MatchScheduler", () => {
  const mockOnScheduleUpdate = jest.fn();

  beforeEach(() => {
    mockOnScheduleUpdate.mockClear();
  });

  it("renders match schedule with all matches", () => {
    renderWithChakra(
      <MatchScheduler
        tournamentId="tournament-1"
        matches={mockMatches}
        tables={mockTables}
        onScheduleUpdate={mockOnScheduleUpdate}
        isAdmin={true}
      />,
    );

    expect(screen.getByText("Match Schedule")).toBeInTheDocument();
    expect(screen.getByText("Match 1")).toBeInTheDocument();
    expect(screen.getByText("Match 2")).toBeInTheDocument();
    expect(screen.getByText("Match 3")).toBeInTheDocument();
  });

  it("displays match information correctly", () => {
    renderWithChakra(
      <MatchScheduler
        tournamentId="tournament-1"
        matches={mockMatches}
        tables={mockTables}
        onScheduleUpdate={mockOnScheduleUpdate}
        isAdmin={true}
      />,
    );

    // Check player names
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();
    expect(screen.getByText("Player 4")).toBeInTheDocument();

    // Check match status
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("opens schedule modal when clicking schedule button", () => {
    renderWithChakra(
      <MatchScheduler
        tournamentId="tournament-1"
        matches={mockMatches}
        tables={mockTables}
        onScheduleUpdate={mockOnScheduleUpdate}
        isAdmin={true}
      />,
    );

    const scheduleButton = screen.getByText("Schedule");
    fireEvent.click(scheduleButton);

    expect(screen.getByText("Schedule Match")).toBeInTheDocument();
  });

  it("disables schedule button for completed matches", () => {
    const completedMatch = {
      ...mockMatches[0],
      status: "completed",
      endTime: "2024-01-16T10:30:00Z",
    };

    renderWithChakra(
      <MatchScheduler
        tournamentId="tournament-1"
        matches={[completedMatch, ...mockMatches.slice(1)]}
        tables={mockTables}
        onScheduleUpdate={mockOnScheduleUpdate}
        isAdmin={true}
      />,
    );

    const scheduleButton = screen.getByText("Schedule");
    expect(scheduleButton).toBeDisabled();
  });

  it("disables schedule button for non-admin users", () => {
    renderWithChakra(
      <MatchScheduler
        tournamentId="tournament-1"
        matches={mockMatches}
        tables={mockTables}
        onScheduleUpdate={mockOnScheduleUpdate}
        isAdmin={false}
      />,
    );

    const scheduleButton = screen.getByText("Schedule");
    expect(scheduleButton).toBeDisabled();
  });

  it("calls onScheduleUpdate when submitting schedule form", async () => {
    renderWithChakra(
      <MatchScheduler
        tournamentId="tournament-1"
        matches={mockMatches}
        tables={mockTables}
        onScheduleUpdate={mockOnScheduleUpdate}
        isAdmin={true}
      />,
    );

    // Open schedule modal
    const scheduleButton = screen.getByText("Schedule");
    fireEvent.click(scheduleButton);

    // Fill in form
    const startTimeInput = screen.getByLabelText("Start Time");
    fireEvent.change(startTimeInput, {
      target: { value: "2024-01-16T12:00:00" },
    });

    const durationSelect = screen.getByLabelText("Duration (minutes)");
    fireEvent.change(durationSelect, { target: { value: "45" } });

    const tableSelect = screen.getByLabelText("Table Number");
    fireEvent.change(tableSelect, { target: { value: "3" } });

    // Submit form
    const submitButton = screen.getByText("Schedule");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnScheduleUpdate).toHaveBeenCalledWith("3", {
        startTime: "2024-01-16T12:00:00",
        duration: 45,
        tableNumber: 3,
        status: "scheduled",
      });
    });
  });

  it("shows error toast when schedule update fails", async () => {
    mockOnScheduleUpdate.mockRejectedValueOnce(new Error("Failed to schedule"));

    renderWithChakra(
      <MatchScheduler
        tournamentId="tournament-1"
        matches={mockMatches}
        tables={mockTables}
        onScheduleUpdate={mockOnScheduleUpdate}
        isAdmin={true}
      />,
    );

    // Open schedule modal
    const scheduleButton = screen.getByText("Schedule");
    fireEvent.click(scheduleButton);

    // Fill in form
    const startTimeInput = screen.getByLabelText("Start Time");
    fireEvent.change(startTimeInput, {
      target: { value: "2024-01-16T12:00:00" },
    });

    // Submit form
    const submitButton = screen.getByText("Schedule");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to schedule match")).toBeInTheDocument();
    });
  });
});

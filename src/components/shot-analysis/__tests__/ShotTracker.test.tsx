/// <reference types="jest" />
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShotTracker } from "../ShotTracker";
import { ShotAnalysisService } from "../../../ai/shot-analysis/ShotAnalysisService";

// Mock the ShotAnalysisService
jest.mock("../../../ai/shot-analysis/ShotAnalysisService");

describe("ShotTracker", () => {
  let mockService: jest.Mocked<ShotAnalysisService>;

  beforeEach(() => {
    mockService = new ShotAnalysisService() as jest.Mocked<ShotAnalysisService>;
    (ShotAnalysisService as jest.Mock).mockImplementation(() => mockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders shot tracker interface", () => {
    render(<ShotTracker />);

    expect(screen.getByText("Shot Tracker")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Tracking" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Shot Success" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Shot Failed" }),
    ).toBeInTheDocument();
  });

  it("starts tracking when start button is clicked", () => {
    render(<ShotTracker />);

    const startButton = screen.getByRole("button", { name: "Start Tracking" });
    fireEvent.click(startButton);

    expect(mockService.startTracking).toHaveBeenCalled();
  });

  it("completes shot when success button is clicked", () => {
    render(<ShotTracker />);

    // Simulate tracking started
    mockService.emit("trackingStarted");

    const successButton = screen.getByRole("button", { name: "Shot Success" });
    fireEvent.click(successButton);

    expect(mockService.completeShot).toHaveBeenCalledWith(true, 0.95);
  });

  it("completes shot when fail button is clicked", () => {
    render(<ShotTracker />);

    // Simulate tracking started
    mockService.emit("trackingStarted");

    const failButton = screen.getByRole("button", { name: "Shot Failed" });
    fireEvent.click(failButton);

    expect(mockService.completeShot).toHaveBeenCalledWith(false, 0.95);
  });

  it("calls onShotComplete callback when shot is completed", () => {
    const onShotComplete = jest.fn();
    render(<ShotTracker onShotComplete={onShotComplete} />);

    const mockShot = {
      timestamp: Date.now(),
      ballPositions: {
        cueBall: { x: 10, y: 20 },
        targetBall: { x: 30, y: 40 },
      },
      shotType: "straight",
      power: 0.8,
      spin: { top: 0.2, side: 0.1 },
      success: true,
      accuracy: 0.95,
    };

    // Simulate shot completed
    mockService.emit("shotCompleted", mockShot);

    expect(onShotComplete).toHaveBeenCalledWith(mockShot);
  });

  it("updates canvas when positions are updated", () => {
    render(<ShotTracker />);

    const positions = {
      cueBall: { x: 100, y: 150 },
      targetBall: { x: 200, y: 250 },
    };

    // Mock canvas context
    const mockContext = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
    };

    const canvas = screen.getByRole("img");
    jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

    // Simulate positions updated
    mockService.emit("positionsUpdated", positions);

    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.beginPath).toHaveBeenCalledTimes(2);
    expect(mockContext.arc).toHaveBeenCalledTimes(2);
  });
});

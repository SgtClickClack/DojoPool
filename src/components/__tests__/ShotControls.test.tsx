import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShotControls } from "../ShotControls";

describe("ShotControls Component", () => {
  const mockOnShot = jest.fn();
  const mockOnPowerChange = jest.fn();
  const mockOnAngleChange = jest.fn();

  beforeEach(() => {
    render(
      <ShotControls
        power={50}
        angle={45}
        onShot={mockOnShot}
        onPowerChange={mockOnPowerChange}
        onAngleChange={mockOnAngleChange}
      />,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders shot controls correctly", () => {
    expect(screen.getByTestId("shot-controls")).toBeInTheDocument();
    expect(screen.getByTestId("power-slider")).toBeInTheDocument();
    expect(screen.getByTestId("angle-slider")).toBeInTheDocument();
  });

  it("handles power changes", () => {
    const powerSlider = screen.getByTestId("power-slider");
    fireEvent.change(powerSlider, { target: { value: "75" } });
    expect(mockOnPowerChange).toHaveBeenCalledWith(75);
  });

  it("handles angle changes", () => {
    const angleSlider = screen.getByTestId("angle-slider");
    fireEvent.change(angleSlider, { target: { value: "90" } });
    expect(mockOnAngleChange).toHaveBeenCalledWith(90);
  });

  it("triggers shot on button click", () => {
    const shotButton = screen.getByTestId("shot-button");
    fireEvent.click(shotButton);
    expect(mockOnShot).toHaveBeenCalledWith({
      power: 50,
      angle: 45,
    });
  });

  it("disables controls during shot", () => {
    render(
      <ShotControls
        power={50}
        angle={45}
        onShot={mockOnShot}
        onPowerChange={mockOnPowerChange}
        onAngleChange={mockOnAngleChange}
        isShooting={true}
      />,
    );

    expect(screen.getByTestId("power-slider")).toBeDisabled();
    expect(screen.getByTestId("angle-slider")).toBeDisabled();
    expect(screen.getByTestId("shot-button")).toBeDisabled();
  });
});

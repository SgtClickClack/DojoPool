import React from "react";
import { render, screen } from "@testing-library/react";
import { ChartLoadingSkeleton, StatLoadingSkeleton } from "../LoadingSkeletons";

describe("ChartLoadingSkeleton", () => {
  it("renders with correct aria-label", () => {
    render(<ChartLoadingSkeleton />);
    expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();
  });
});

describe("StatLoadingSkeleton", () => {
  it("renders skeleton elements", () => {
    render(<StatLoadingSkeleton />);
    // Check for presence of skeletons by role or structure
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
}); 
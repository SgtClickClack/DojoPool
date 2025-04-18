import React from "react";
import { render, screen } from "../test-utils";
import LoadingSkeleton from "../../components/common/LoadingSkeleton";

describe("LoadingSkeleton", () => {
  it("renders with default props", () => {
    render(<LoadingSkeleton />);
    const skeleton = screen.getByTestId("loading-skeleton");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders with custom width and height", () => {
    render(<LoadingSkeleton width={200} height={100} />);
    const skeleton = screen.getByTestId("loading-skeleton");
    expect(skeleton).toHaveStyle({
      width: "200px",
      height: "100px",
    });
  });

  it("renders with custom variant", () => {
    render(<LoadingSkeleton variant="circular" />);
    const skeleton = screen.getByTestId("loading-skeleton");
    expect(skeleton).toHaveClass("MuiSkeleton-circular");
  });

  it("renders with custom animation", () => {
    render(<LoadingSkeleton animation="wave" />);
    const skeleton = screen.getByTestId("loading-skeleton");
    expect(skeleton).toHaveClass("MuiSkeleton-wave");
  });
});

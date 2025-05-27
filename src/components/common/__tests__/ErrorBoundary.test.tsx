import React from "react";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Child Component</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Child Component")).toBeInTheDocument();
  });

  it("catches error and renders fallback UI", () => {
    // Component that throws
    const ProblemChild = () => {
      throw new Error("Test error");
    };
    // Suppress error output in test
    jest.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });
}); 
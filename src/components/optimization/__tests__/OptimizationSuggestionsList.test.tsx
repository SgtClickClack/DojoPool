import React from "react";
import { render, screen } from "@testing-library/react";
import OptimizationSuggestionsList from "../OptimizationSuggestionsList";

describe("OptimizationSuggestionsList", () => {
  it("renders suggestions", () => {
    const suggestions = [
      "Consider code splitting",
      "Remove unused dependencies",
    ];
    render(<OptimizationSuggestionsList suggestions={suggestions} />);
    expect(screen.getByText("Optimization Suggestions")).toBeInTheDocument();
    expect(screen.getByText("Consider code splitting")).toBeInTheDocument();
    expect(screen.getByText("Remove unused dependencies")).toBeInTheDocument();
  });

  it("renders with empty suggestions", () => {
    render(<OptimizationSuggestionsList suggestions={[]} />);
    expect(screen.getByText("Optimization Suggestions")).toBeInTheDocument();
  });
}); 
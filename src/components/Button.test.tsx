import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@mui/material";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});

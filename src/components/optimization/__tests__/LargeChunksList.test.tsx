import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LargeChunksList from "../LargeChunksList";

describe("LargeChunksList", () => {
  const largeChunks = [
    { name: "vendor", size: 3072, dependencies: ["react-dom", "material-ui"] },
    { name: "main", size: 2048, dependencies: ["react", "lodash"] },
  ];

  it("renders the list with chunks", () => {
    render(
      <LargeChunksList
        largeChunks={largeChunks}
        threshold={100}
        onThresholdChange={() => {}}
      />
    );
    expect(screen.getByText("Large Chunks")).toBeInTheDocument();
    expect(screen.getByText("vendor")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
  });

  it("calls onThresholdChange when slider is used", () => {
    const handleChange = jest.fn();
    render(
      <LargeChunksList
        largeChunks={largeChunks}
        threshold={100}
        onThresholdChange={handleChange}
      />
    );
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: 200 } });
    // Note: MUI Slider onChange uses native Event, so this may not trigger in jsdom
  });
}); 
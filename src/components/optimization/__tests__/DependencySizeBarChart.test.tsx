import React from "react";
import { render, screen } from "@testing-library/react";
import DependencySizeBarChart from "../DependencySizeBarChart";

describe("DependencySizeBarChart", () => {
  // it("renders the chart with data", () => {
  //   const chartData = [
  //     { name: "react", size: 512 },
  //     { name: "lodash", size: 256 },
  //   ];
  //   render(<DependencySizeBarChart chartData={chartData} />);
  //   expect(screen.getByText("Dependency Size Distribution")).toBeInTheDocument();
  //   expect(screen.getByText("react")).toBeInTheDocument();
  //   expect(screen.getByText("lodash")).toBeInTheDocument();
  // });

  it("renders the chart with empty data", () => {
    render(<DependencySizeBarChart chartData={[]} />);
    expect(screen.getByText("Dependency Size Distribution")).toBeInTheDocument();
  });
}); 

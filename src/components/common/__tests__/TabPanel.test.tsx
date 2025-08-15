import React from "react";
import { render, screen } from "@testing-library/react";
import TabPanel from "../TabPanel";

describe("TabPanel", () => {
  it("renders children when value matches index", () => {
    render(
      <TabPanel value={0} index={0}>
        <div>Tab Content</div>
      </TabPanel>
    );
    expect(screen.getByText("Tab Content")).toBeInTheDocument();
  });

  it("does not render children when value does not match index", () => {
    render(
      <TabPanel value={1} index={0}>
        <div>Tab Content</div>
      </TabPanel>
    );
    expect(screen.queryByText("Tab Content")).not.toBeInTheDocument();
  });
}); 

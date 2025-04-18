import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material";
import BundleOptimizationDashboard from "../BundleOptimizationDashboard";

// Mock data
const mockAnalysis = {
  total_size: 1024 * 1024 * 5, // 5MB
  chunks: [
    { name: "main", size: 1024 * 1024 * 2, dependencies: ["react", "lodash"] },
    {
      name: "vendor",
      size: 1024 * 1024 * 3,
      dependencies: ["react-dom", "material-ui"],
    },
  ],
  dependencies: {
    react: 1024 * 512,
    "react-dom": 1024 * 768,
    lodash: 1024 * 256,
    "material-ui": 1024 * 1024,
  },
  optimization_suggestions: [
    "Consider code splitting",
    "Remove unused dependencies",
  ],
};

const mockLargeChunks = [
  {
    name: "vendor",
    size: 1024 * 1024 * 3,
    dependencies: ["react-dom", "material-ui"],
  },
];

// Mock fetch
global.fetch = jest.fn();

// Setup theme for testing
const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe("BundleOptimizationDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAnalysis),
      }),
    );
  });

  describe("Initial Render", () => {
    it("should render loading skeleton initially", () => {
      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });
      expect(
        screen.getByLabelText("Loading bundle optimization dashboard"),
      ).toBeInTheDocument();
    });

    it("should fetch and display bundle analysis data", async () => {
      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText("Total Size: 5.00 MB")).toBeInTheDocument();
        expect(screen.getByText("Number of Chunks: 2")).toBeInTheDocument();
        expect(
          screen.getByText("Number of Dependencies: 4"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message on fetch failure", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error("Failed to fetch")),
      );

      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
        expect(screen.getByText("RETRY")).toBeInTheDocument();
      });
    });

    it("should handle retry action", async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.reject(new Error("Failed to fetch")),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAnalysis),
          }),
        );

      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText("RETRY")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("RETRY"));

      await waitFor(() => {
        expect(screen.getByText("Total Size: 5.00 MB")).toBeInTheDocument();
      });
    });
  });

  describe("Tab Navigation", () => {
    it("should switch between tabs", async () => {
      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText("Bundle Overview")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Large Chunks"));
      expect(screen.getByText("Size Threshold:")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Optimization"));
      expect(screen.getByText("Bundle Optimization")).toBeInTheDocument();
    });
  });

  describe("Bundle Analysis", () => {
    it("should analyze bundle when path is provided", async () => {
      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(
          screen.getByLabelText("Enter bundle path for analysis"),
        ).toBeInTheDocument();
      });

      const input = screen.getByLabelText("Enter bundle path for analysis");
      await userEvent.type(input, "/path/to/bundle.js");

      const analyzeButton = screen.getByText("Analyze Bundle");
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/optimization/bundle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "analyze_bundle",
            data: { bundle_path: "/path/to/bundle.js" },
          }),
        });
      });
    });
  });

  describe("Threshold Changes", () => {
    it("should update threshold and fetch large chunks", async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAnalysis),
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLargeChunks),
          }),
        );

      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText("Large Chunks")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Large Chunks"));

      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "200000" } }); // 200KB

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/optimization/bundle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "get_large_chunks",
            data: { threshold: 200000 },
          }),
        });
      });
    });
  });

  describe("Mobile Responsiveness", () => {
    it("should render mobile layout when screen is small", async () => {
      // Mock useMediaQuery to simulate mobile screen
      jest
        .spyOn(require("@mui/material"), "useMediaQuery")
        .mockReturnValue(true);

      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText("open drawer")).toBeInTheDocument();
      });
    });
  });
});

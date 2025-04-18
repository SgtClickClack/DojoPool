import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { ShotAnalysis } from "../ShotAnalysis";

const renderWithChakra = (component: React.ReactElement) => {
  return render(<ChakraProvider>{component}</ChakraProvider>);
};

describe("ShotAnalysis", () => {
  it("renders loading state initially", () => {
    renderWithChakra(
      <ShotAnalysis
        currentBall={0}
        targetBall={1}
        shotPower={50}
        shotAngle={180}
        shotSpin={0}
        onAnalysisComplete={jest.fn()}
      />,
    );

    expect(screen.getByText("Analyzing shot...")).toBeInTheDocument();
  });

  it("renders analysis results after loading", async () => {
    renderWithChakra(
      <ShotAnalysis
        currentBall={0}
        targetBall={1}
        shotPower={50}
        shotAngle={180}
        shotSpin={0}
        onAnalysisComplete={jest.fn()}
      />,
    );

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText("Success Probability")).toBeInTheDocument();
      expect(screen.getByText("Shot Difficulty")).toBeInTheDocument();
      expect(screen.getByText("Recommendations")).toBeInTheDocument();
      expect(screen.getByText("Tips")).toBeInTheDocument();
      expect(screen.getByText("Warnings")).toBeInTheDocument();
    });
  });

  it("calls onAnalysisComplete with analysis results", async () => {
    const onAnalysisComplete = jest.fn();
    renderWithChakra(
      <ShotAnalysis
        currentBall={0}
        targetBall={1}
        shotPower={50}
        shotAngle={180}
        shotSpin={0}
        onAnalysisComplete={onAnalysisComplete}
      />,
    );

    await waitFor(() => {
      expect(onAnalysisComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          successProbability: expect.any(Number),
          difficulty: expect.stringMatching(/^(easy|medium|hard)$/),
          recommendedPower: expect.any(Number),
          recommendedAngle: expect.any(Number),
          recommendedSpin: expect.any(Number),
          tips: expect.any(Array),
          warnings: expect.any(Array),
        }),
      );
    });
  });

  it("displays correct difficulty badge based on success probability", async () => {
    renderWithChakra(
      <ShotAnalysis
        currentBall={0}
        targetBall={1}
        shotPower={70}
        shotAngle={180}
        shotSpin={0}
        onAnalysisComplete={jest.fn()}
      />,
    );

    await waitFor(() => {
      const difficultyBadge = screen.getByText(/^(Easy|Medium|Hard)$/);
      expect(difficultyBadge).toBeInTheDocument();
    });
  });

  it("displays all tips and warnings", async () => {
    renderWithChakra(
      <ShotAnalysis
        currentBall={0}
        targetBall={1}
        shotPower={50}
        shotAngle={180}
        shotSpin={0}
        onAnalysisComplete={jest.fn()}
      />,
    );

    await waitFor(() => {
      // Check for tips
      expect(
        screen.getByText("Keep your cue level for better accuracy"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Focus on the target ball, not the cue ball"),
      ).toBeInTheDocument();
      expect(screen.getByText("Maintain a steady stance")).toBeInTheDocument();

      // Check for warnings
      expect(
        screen.getByText("High spin may affect accuracy"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Power level might be too high"),
      ).toBeInTheDocument();
      expect(screen.getByText("Angle could be improved")).toBeInTheDocument();
    });
  });
});

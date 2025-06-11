import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../../pages/Home";
import { useRouter } from "next/router";

// Mock the next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

describe("Home Page", () => {
  beforeEach(() => {
    // Setup router mock
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    }));
  });

  it("renders welcome message", () => {
    render(<Home />);
    expect(screen.getByText(/welcome to dojopool/i)).toBeInTheDocument();
  });

  // it("displays featured venues", async () => {
  //   render(<Home />);
  //   await waitFor(() => {
  //     expect(screen.getByTestId("venues-grid")).toBeInTheDocument();
  //   });
  // });

  // it("handles venue selection", async () => {
  //   const router = {
  //     push: jest.fn(),
  //   };
  //   (useRouter as jest.Mock).mockReturnValue(router);
  //
  //   render(<Home />);
  //   const venueCard = await waitFor(() => screen.getByTestId("venue-card-1"));
  //
  //   fireEvent.click(venueCard);
  //   expect(router.push).toHaveBeenCalledWith("/venues/1");
  // });

  // it("displays loading state", () => {
  //   render(<Home />);
  //   expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  // });

  // it("shows error message when venue loading fails", async () => {
  //   render(<Home />);
  //   await waitFor(() => {
  //     expect(screen.getByText(/error loading venues/i)).toBeInTheDocument();
  //   });
  // });
});

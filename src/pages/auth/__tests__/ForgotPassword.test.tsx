import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import ForgotPassword from "../forgot-password";
import { useRouter } from "next/router";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const themeSystem = createSystem(defaultConfig, {});

describe("ForgotPassword", () => {
  const mockRouter = {
    push: jest.fn(),
    query: {},
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <ChakraProvider value={themeSystem}>
        <ForgotPassword />
      </ChakraProvider>,
    );
  };

  it("renders the forgot password form", () => {
    renderComponent();

    expect(screen.getByText("Forgot Password")).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send recovery email/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", {
      name: /send recovery email/i,
    });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address/i),
      ).toBeInTheDocument();
    });
  });

  it("handles successful password reset request", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Recovery email sent" }),
    });

    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", {
      name: /send recovery email/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "test@example.com" }),
      });
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/auth/login");
  });

  it("handles failed password reset request", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Error" }),
    });

    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", {
      name: /send recovery email/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to send recovery email/i),
      ).toBeInTheDocument();
    });
  });

  it("navigates back to login page when clicking back button", () => {
    renderComponent();

    const backButton = screen.getByRole("button", { name: /back to login/i });
    fireEvent.click(backButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/auth/login");
  });
});

import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "../../../dojopool/frontend/components/Auth/[AUTH]Login";
import { renderWithProviders } from "../../utils/testUtils";
import { useAuth } from "../../../dojopool/frontend/hooks/useAuth";
import { useNavigate } from "react-router-dom";

// Mock the hooks
jest.mock("../../../dojopool/frontend/hooks/useAuth");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  Link: jest.fn().mockImplementation(({ children }) => children),
}));

describe("Login Component", () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      error: null,
    });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form correctly", () => {
    renderWithProviders(<Login />);

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account/)).toBeInTheDocument();
  });

  it("handles form submission correctly", async () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    fireEvent.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
  });

  it("displays error message when login fails", () => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      error: "Invalid credentials",
    });

    renderWithProviders(<Login />);

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    renderWithProviders(<Login />);

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    // HTML5 validation messages
    expect(screen.getByLabelText("Email")).toBeInvalid();
    expect(screen.getByLabelText("Password")).toBeInvalid();
  });

  it("navigates to forgot password page", async () => {
    renderWithProviders(<Login />);

    const forgotPasswordLink = screen.getByText("Forgot password?");
    fireEvent.click(forgotPasswordLink);

    expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
  });

  it("navigates to register page", async () => {
    renderWithProviders(<Login />);

    const registerLink = screen.getByText("Sign up");
    fireEvent.click(registerLink);

    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });

  it("prevents form submission with invalid email", async () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await userEvent.type(emailInput, "invalid-email");
    await userEvent.type(passwordInput, "password123");
    fireEvent.click(submitButton);

    expect(mockLogin).not.toHaveBeenCalled();
    expect(emailInput).toBeInvalid();
  });

  it("disables submit button during login attempt", async () => {
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});

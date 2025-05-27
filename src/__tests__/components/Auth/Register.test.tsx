import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Register } from '../../../../src/dojopool/frontend/components/Auth/[AUTH]Register';
import { useAuth } from '../../../../src/dojopool/frontend/contexts/AuthContext';
import { useNavigate } from "react-router-dom";

// Mock the hooks
jest.mock("../../../dojopool/frontend/hooks/useAuth");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  Link: jest.fn().mockImplementation(({ children }) => children),
}));

describe("Register Component", () => {
  let mockRegister: jest.Mock;
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockRegister = jest.fn();
    mockNavigate = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      loading: false,
      error: null,
    });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(<Register />);
  };

  it("renders registration form correctly", () => {
    renderComponent();

    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
    expect(screen.getByText(/Already have an account/)).toBeInTheDocument();
  });

  it("handles form submission correctly", async () => {
    renderComponent();

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Sign Up" });

    await userEvent.type(nameInput, "Test User");
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmPasswordInput, "password123");
    fireEvent.click(submitButton);

    expect(mockRegister).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
      "Test User",
    );
  });

  it("displays error message when registration fails", () => {
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      error: "Email already exists",
    });

    renderComponent();

    expect(screen.getByText("Email already exists")).toBeInTheDocument();
  });

  it("validates password match", async () => {
    renderComponent();

    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Sign Up" });

    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmPasswordInput, "password456");
    fireEvent.click(submitButton);

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("validates required fields", async () => {
    renderComponent();

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(submitButton);

    // HTML5 validation messages
    expect(screen.getByLabelText("Name")).toBeInvalid();
    expect(screen.getByLabelText("Email")).toBeInvalid();
    expect(screen.getByLabelText("Password")).toBeInvalid();
    expect(screen.getByLabelText("Confirm Password")).toBeInvalid();
  });

  it("navigates to login page", async () => {
    renderComponent();

    const loginLink = screen.getByText("Sign in");
    fireEvent.click(loginLink);

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("prevents form submission with invalid email", async () => {
    renderComponent();

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Sign Up" });

    await userEvent.type(nameInput, "Test User");
    await userEvent.type(emailInput, "invalid-email");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmPasswordInput, "password123");
    fireEvent.click(submitButton);

    expect(mockRegister).not.toHaveBeenCalled();
    expect(emailInput).toBeInvalid();
  });

  it("disables submit button during registration attempt", async () => {
    mockRegister.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    renderComponent();

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Sign Up" });

    await userEvent.type(nameInput, "Test User");
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmPasswordInput, "password123");
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("clears password error when passwords match", async () => {
    renderComponent();

    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Sign Up" });

    // First create a mismatch
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmPasswordInput, "password456");
    fireEvent.click(submitButton);

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();

    // Then fix the mismatch
    await userEvent.clear(confirmPasswordInput);
    await userEvent.type(confirmPasswordInput, "password123");
    fireEvent.click(submitButton);

    expect(
      screen.queryByText("Passwords do not match"),
    ).not.toBeInTheDocument();
  });
});

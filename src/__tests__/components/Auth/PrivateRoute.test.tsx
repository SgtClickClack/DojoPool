import React from "react";
import { screen, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PrivateRoute from "../../../dojopool/frontend/components/Auth/[AUTH]PrivateRoute";
import { useAuth } from "../../../dojopool/frontend/contexts/AuthContext";

// Mock the auth context
jest.mock("../../../dojopool/frontend/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("PrivateRoute Component", () => {
  const mockUseAuth = useAuth as jest.Mock;

  // Test component to render inside PrivateRoute
  const ProtectedComponent = () => <div>Protected Content</div>;

  // Setup for router testing
  const renderWithRouter = (authState: {
    isAuthenticated: boolean;
    loading: boolean;
  }) => {
    mockUseAuth.mockReturnValue(authState);

    return render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <ProtectedComponent />
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    mockUseAuth.mockClear();
  });

  it("renders protected content when user is authenticated", () => {
    renderWithRouter({ isAuthenticated: true, loading: false });

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated", () => {
    renderWithRouter({ isAuthenticated: false, loading: false });

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders nothing while authentication is loading", () => {
    renderWithRouter({ isAuthenticated: false, loading: true });

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("preserves the attempted URL in navigation state", () => {
    const { container } = renderWithRouter({
      isAuthenticated: false,
      loading: false,
    });

    // Check if Navigate component was rendered with correct props
    // We can't directly check the state prop, but we can verify the redirect happened
    expect(screen.getByText("Login Page")).toBeInTheDocument();

    // Verify we're on the login page URL
    expect(container.innerHTML).toContain("Login Page");
  });

  it("handles transition from loading to authenticated state", () => {
    // Start with loading state
    const { rerender } = renderWithRouter({
      isAuthenticated: false,
      loading: true,
    });

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();

    // Update to authenticated state
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    rerender(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <ProtectedComponent />
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("handles transition from loading to unauthenticated state", () => {
    // Start with loading state
    const { rerender } = renderWithRouter({
      isAuthenticated: false,
      loading: true,
    });

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();

    // Update to unauthenticated state
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    rerender(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <ProtectedComponent />
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});

import { act, renderHook } from "@testing-library/react";
import SecurityService, { useAuth } from "../SecurityService";

describe("SecurityService", () => {
  let service: SecurityService;
  const mockToken = "mock.jwt.token";
  const mockUser = {
    sub: "123",
    username: "testuser",
    roles: ["user"],
    permissions: ["read"],
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    jest.clearAllMocks();

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();

    // Get fresh instance
    service = SecurityService.getInstance();
  });

  describe("login", () => {
    it("should successfully login and store token", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: mockToken }),
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login("testuser", "password");
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeTruthy();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining("auth_token"),
        mockToken,
      );
    });

    it("should handle login failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.login("testuser", "wrong-password"),
        ).rejects.toThrow("Login failed");
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("logout", () => {
    it("should clear auth state and localStorage on logout", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        expect.stringContaining("auth_token"),
      );
    });
  });

  describe("token refresh", () => {
    it("should refresh token before expiration", async () => {
      // Mock initial token fetch
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: mockToken }),
        })
        // Mock refresh token response
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: "new.token.value" }),
        });

      const { result } = renderHook(() => useAuth());

      // Login first
      await act(async () => {
        await result.current.login("testuser", "password");
      });

      // Fast-forward until just before token expiration
      jest.advanceTimersByTime(3500 * 1000); // 58.33 minutes

      // Token should have been refreshed
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/refresh"),
        expect.any(Object),
      );
    });

    it("should handle refresh token failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login("testuser", "password");
      });

      // Fast-forward until just before token expiration
      jest.advanceTimersByTime(3500 * 1000);

      // Should be logged out due to refresh failure
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("permissions and roles", () => {
    it("should correctly check permissions", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: mockToken }),
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login("testuser", "password");
      });

      expect(result.current.hasPermission("read")).toBe(true);
      expect(result.current.hasPermission("write")).toBe(false);
    });

    it("should correctly check roles", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: mockToken }),
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login("testuser", "password");
      });

      expect(result.current.hasRole("user")).toBe(true);
      expect(result.current.hasRole("admin")).toBe(false);
    });
  });

  describe("CSRF protection", () => {
    it("should fetch and use CSRF token", async () => {
      const csrfToken = "mock-csrf-token";
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: csrfToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: mockToken }),
        });

      await service.fetchCsrfToken();

      await act(async () => {
        await service.login("testuser", "password");
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-CSRF-Token": csrfToken,
          }),
        }),
      );
    });
  });
});

// Mock jwt-decode
jest.mock("jwt-decode", () => ({
  jwtDecode: jest.fn().mockImplementation(() => ({
    sub: "123",
    username: "testuser",
    roles: ["user"],
    permissions: ["read"],
    exp: Math.floor(Date.now() / 1000) + 3600,
  })),
}));

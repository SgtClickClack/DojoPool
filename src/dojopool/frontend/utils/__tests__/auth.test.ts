import { AuthManager, UserRole } from '../auth';

describe('AuthManager', () => {
  let authManager: AuthManager;
  let mockFetch: jest.Mock;
  let originalFetch: typeof fetch;
  let mockSessionStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock sessionStorage
    mockSessionStorage = {};
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((key) => mockSessionStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockSessionStorage[key];
        }),
        clear: jest.fn(() => {
          mockSessionStorage = {};
        }),
      },
      writable: true,
    });

    // Mock fetch
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Reset singleton instance
    (AuthManager as any).instance = null;
    authManager = AuthManager.getInstance({
      apiUrl: '/test/auth',
      tokenRefreshThreshold: 300000,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login and store session', async () => {
      const mockSession = {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
          roles: [UserRole.ADMIN],
          permissions: ['read', 'write'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

      await authManager.login('testuser', 'password');

      expect(mockFetch).toHaveBeenCalledWith('/test/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password',
        }),
      });

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'auth_session',
        JSON.stringify(mockSession)
      );
    });

    it('should throw error on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(authManager.login('testuser', 'wrong-password')).rejects.toThrow('Login failed');
    });
  });

  describe('logout', () => {
    it('should clear session on logout', async () => {
      const mockSession = {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        user: {
          id: '123',
          username: 'testuser',
          roles: [UserRole.ADMIN],
        },
      };

      mockSessionStorage['auth_session'] = JSON.stringify(mockSession);

      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await authManager.logout();

      expect(mockFetch).toHaveBeenCalledWith('/test/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('auth_session');
    });
  });

  describe('token refresh', () => {
    it('should refresh token when near expiry', async () => {
      const mockSession = {
        token: 'old-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 200000, // Near expiry
        user: {
          id: '123',
          username: 'testuser',
          roles: [UserRole.ADMIN],
        },
      };

      const mockNewSession = {
        ...mockSession,
        token: 'new-token',
        expiresAt: Date.now() + 3600000,
      };

      mockSessionStorage['auth_session'] = JSON.stringify(mockSession);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNewSession),
      });

      await authManager.getAuthenticatedUser();

      expect(mockFetch).toHaveBeenCalledWith('/test/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'test-refresh-token',
        }),
      });

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'auth_session',
        JSON.stringify(mockNewSession)
      );
    });

    it('should not refresh token when not near expiry', async () => {
      const mockSession = {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000, // Not near expiry
        user: {
          id: '123',
          username: 'testuser',
          roles: [UserRole.ADMIN],
        },
      };

      mockSessionStorage['auth_session'] = JSON.stringify(mockSession);

      await authManager.getAuthenticatedUser();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('role and permission checks', () => {
    beforeEach(() => {
      const mockSession = {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        user: {
          id: '123',
          username: 'testuser',
          roles: [UserRole.ADMIN],
          permissions: ['read', 'write'],
        },
      };

      mockSessionStorage['auth_session'] = JSON.stringify(mockSession);
    });

    it('should correctly check roles', async () => {
      expect(authManager.hasRole(UserRole.ADMIN)).toBe(true);
      expect(authManager.hasRole(UserRole.OPERATOR)).toBe(false);
    });

    it('should correctly check permissions', async () => {
      expect(authManager.hasPermission('read')).toBe(true);
      expect(authManager.hasPermission('delete')).toBe(false);
    });

    it('should throw error when requiring missing role', async () => {
      await expect(authManager.requireRole(UserRole.OPERATOR)).rejects.toThrow(
        'Required role OPERATOR not found'
      );
    });

    it('should throw error when requiring missing permission', async () => {
      await expect(authManager.requirePermission('delete')).rejects.toThrow(
        'Required permission delete not found'
      );
    });
  });
});

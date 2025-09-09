import api from './APIService';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin?: boolean;
  };
  access_token?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin?: boolean;
  role?: string;
}

class AuthService {
  private readonly baseUrl = '/v1/auth';

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/login`, credentials);
      const data = response.data;

      // Store tokens in localStorage
      const accessToken = data.access_token || data.token;
      const refreshToken = data.refresh_token || data.refreshToken;
      if (accessToken) localStorage.setItem('auth_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/register`, userData);
      const data = response.data;

      // Store tokens in localStorage
      const accessToken = data.access_token || data.token;
      const refreshToken = data.refresh_token || data.refreshToken;
      if (accessToken) localStorage.setItem('auth_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed. Please try again.');
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if it exists
      await api.post(`${this.baseUrl}/logout`);
    } catch (error) {
      console.warn(
        'Logout endpoint not available, proceeding with local cleanup'
      );
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return null;
      }

      const response = await api.get('/v1/users/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      // If there's an auth error, clear tokens
      if (
        error &&
        typeof error === 'object' &&
        'response' in (error as any) &&
        (error as any).response?.status === 401
      ) {
        this.logout();
      }
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return null;
      }

      const response = await api.post(`${this.baseUrl}/refresh`, {
        refresh_token: refreshToken,
      });

      const newAccessToken = response.data.access_token || response.data.token;
      const newRefreshToken =
        response.data.refresh_token || response.data.refreshToken;
      if (newAccessToken) localStorage.setItem('auth_token', newAccessToken);
      if (newRefreshToken)
        localStorage.setItem('refresh_token', newRefreshToken);
      if (newAccessToken) return newAccessToken;

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens on refresh failure
      this.logout();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }
}

const authService = new AuthService();
export default authService;

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
  token: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin?: boolean;
}

class AuthService {
  private readonly baseUrl = '/v1/auth';

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/login`, credentials);
      const data = response.data;

      // Store tokens in localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }

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
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }

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
        'response' in error &&
        error.response?.status === 401
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

      const newToken = response.data.token;
      if (newToken) {
        localStorage.setItem('auth_token', newToken);
        return newToken;
      }

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
}

export default new AuthService();

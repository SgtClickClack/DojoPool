import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { mockAuthService } from '../test-utils';

describe('Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockAuthService.login.mockResolvedValueOnce({ user: mockUser, token: 'test-token' });

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(localStorage.getItem('auth_token')).toBe('test-token');
      });
    });

    it('should handle login errors', async () => {
      mockAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-password' } });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Registration Flow', () => {
    it('should handle successful registration', async () => {
      const mockUser = { id: '1', email: 'new@example.com', name: 'New User' };
      mockAuthService.register.mockResolvedValueOnce({ user: mockUser, token: 'test-token' });

      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New User' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123'
        });
        expect(localStorage.getItem('auth_token')).toBe('test-token');
      });
    });

    it('should validate registration form', async () => {
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should maintain session with valid token', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockAuthService.validateToken.mockResolvedValueOnce(mockUser);
      localStorage.setItem('auth_token', 'valid-token');

      render(
        <AuthProvider>
          <div data-testid="auth-status">
            {({ user }) => user ? 'authenticated' : 'unauthenticated'}
          </div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('authenticated')).toBeInTheDocument();
      });
    });

    it('should clear session on logout', async () => {
      localStorage.setItem('auth_token', 'test-token');
      const { getByRole } = render(
        <AuthProvider>
          <button onClick={() => useAuth().logout()}>Logout</button>
        </AuthProvider>
      );

      fireEvent.click(getByRole('button', { name: /logout/i }));

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(mockAuthService.logout).toHaveBeenCalled();
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login for unauthenticated users', async () => {
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', () => ({
        useNavigate: () => mockNavigate,
      }));

      render(
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should render protected content for authenticated users', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockAuthService.validateToken.mockResolvedValueOnce(mockUser);
      localStorage.setItem('auth_token', 'valid-token');

      render(
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Auth Middleware', () => {
    it('should add auth token to API requests', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockAuthService.validateToken.mockResolvedValueOnce(mockUser);
      localStorage.setItem('auth_token', 'test-token');

      const mockFetch = vi.fn().mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      global.fetch = mockFetch;

      await mockAuthService.makeAuthenticatedRequest('/api/protected');

      expect(mockFetch).toHaveBeenCalledWith('/api/protected', {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle token expiration', async () => {
      localStorage.setItem('auth_token', 'expired-token');
      mockAuthService.validateToken.mockRejectedValueOnce(new Error('Token expired'));

      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', () => ({
        useNavigate: () => mockNavigate,
      }));

      await mockAuthService.makeAuthenticatedRequest('/api/protected');

      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });
}); 
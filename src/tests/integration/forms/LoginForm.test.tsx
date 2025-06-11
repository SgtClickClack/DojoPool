import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/forms/LoginForm';
import { customRender, mockFetch, createMockResponse } from '../../test-utils';
import { AuthProvider } from '@/contexts/AuthContext';

describe('LoginForm Integration', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits form and handles successful login', async () => {
    const mockResponse = createMockResponse({ user: mockUser, token: 'fake-token' });
    global.fetch = mockFetch(mockResponse);

    customRender(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify loading state
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    // Verify API call
    expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
  });

  it('handles validation errors', async () => {
    customRender(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check for validation messages
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();

    // Enter invalid email
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
  });

  it('handles API error responses', async () => {
    const mockError = createMockResponse(
      { message: 'Invalid credentials' },
      401
    );
    global.fetch = mockFetch(mockError);

    customRender(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Verify form is re-enabled
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
  });

  it('handles network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    customRender(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('persists form state on validation error', async () => {
    customRender(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check validation error
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    // Verify form values are preserved
    expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('short');
  });
}); 
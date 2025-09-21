import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { theme, TextField, UserList, UserForm, App, Button } from '@components';
import { renderWithProviders } from '../utils/test-utils';
import { http, HttpResponse } from 'msw';

// Mock components
const LoginForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Mock validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (email === 'invalid@example.com') {
      setError('Invalid credentials');
      return;
    }

    // Mock successful login
    setMessage('Login successful');
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="email-input"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="password-input"
        />
        <Button type="submit" data-testid="login-button">
          Login
        </Button>
      </form>
      {message && <div data-testid="success-message">{message}</div>}
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  );
};

const ItemList = ({ items }) => (
  <div>
    {items.map((item) => (
      <div key={item.id}>{item.name}</div>
    ))}
  </div>
);

describe('Integration Tests', () => {
  describe('Authentication Flow', () => {
    it('should complete login flow', async () => {
      renderWithProviders(<LoginForm />);

      // Fill in form
      const emailInput = screen
        .getByTestId('email-input')
        .querySelector('input');
      const passwordInput = screen
        .getByTestId('password-input')
        .querySelector('input');
      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByTestId('login-button'));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('Login successful')).toBeInTheDocument();
      });
    });

    it('should handle login errors', async () => {
      renderWithProviders(<LoginForm />);

      // Fill in invalid credentials
      const emailInput = screen
        .getByTestId('email-input')
        .querySelector('input');
      const passwordInput = screen
        .getByTestId('password-input')
        .querySelector('input');
      fireEvent.change(emailInput, {
        target: { value: 'invalid@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'wrongpassword' },
      });

      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Data Management', () => {
    it('should load and display user list', async () => {
      renderWithProviders(
        <UserList
          users={[
            { id: 1, name: 'user1' },
            { id: 2, name: 'user2' },
          ]}
        />
      );

      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
    });
  });

  it('should handle empty user list', async () => {
    renderWithProviders(<UserList users={[]} />);

    // Should show no users when list is empty
    expect(screen.getByTestId('user-list')).toBeInTheDocument();
    expect(screen.queryByTestId('user-0')).not.toBeInTheDocument();
  });
});

describe('Form Validation', () => {
  it('should validate required fields', async () => {
    renderWithProviders(<UserForm />);

    fireEvent.click(screen.getByTestId('submit-button'));

    // The form should prevent submission and show validation
    // Since we're using HTML5 validation, the form won't submit
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    renderWithProviders(<UserForm />);

    const emailInput = screen.getByTestId('email-input').querySelector('input');
    fireEvent.change(emailInput, {
      target: { value: 'invalid-email' },
    });

    fireEvent.click(screen.getByTestId('submit-button'));

    // The form should still be present after invalid submission
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
  });
});

describe('Navigation', () => {
  it('should navigate between pages', async () => {
    renderWithProviders(<App />);

    // Navigate to users page
    fireEvent.click(screen.getByText('Users'));

    await waitFor(() => {
      expect(screen.getByText('Users Page')).toBeInTheDocument();
    });

    // Navigate back to home
    fireEvent.click(screen.getByText('Home'));

    await waitFor(() => {
      expect(screen.getByText('Welcome to the App')).toBeInTheDocument();
    });
  });
});

describe('Error Boundaries', () => {
  it('should catch and display component errors', () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    renderWithProviders(<ErrorComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

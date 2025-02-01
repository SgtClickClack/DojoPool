import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPassword } from '../../../dojopool/frontend/components/Auth/[AUTH]ForgotPassword';
import { renderWithProviders } from '../../utils/testUtils';
import { useNavigate } from 'react-router-dom';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: jest.fn().mockImplementation(({ children }) => children),
}));

describe('ForgotPassword Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('renders forgot password form correctly', () => {
    renderWithProviders(<ForgotPassword />);
    
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByText(/Enter your email address/)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
    expect(screen.getByText('Back to Sign In')).toBeInTheDocument();
  });

  it('handles successful password reset request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Reset email sent' }),
    });

    renderWithProviders(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

    await userEvent.type(emailInput, 'test@example.com');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Check your email for instructions/)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
  });

  it('handles failed password reset request', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to send reset email'));

    renderWithProviders(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

    await userEvent.type(emailInput, 'test@example.com');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send reset email')).toBeInTheDocument();
    });
  });

  it('validates required email field', async () => {
    renderWithProviders(<ForgotPassword />);
    
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    fireEvent.click(submitButton);

    expect(screen.getByLabelText('Email')).toBeInvalid();
  });

  it('validates email format', async () => {
    renderWithProviders(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.click(submitButton);

    expect(emailInput).toBeInvalid();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('navigates to login page', async () => {
    renderWithProviders(<ForgotPassword />);
    
    const loginLink = screen.getByText('Back to Sign In');
    fireEvent.click(loginLink);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('disables submit button during request', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

    await userEvent.type(emailInput, 'test@example.com');
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('shows error message for server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    renderWithProviders(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

    await userEvent.type(emailInput, 'test@example.com');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send reset email')).toBeInTheDocument();
    });
  });

  it('clears error message on successful submission', async () => {
    // First, trigger an error
    mockFetch.mockRejectedValueOnce(new Error('Failed to send reset email'));
    
    renderWithProviders(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

    await userEvent.type(emailInput, 'test@example.com');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send reset email')).toBeInTheDocument();
    });

    // Then, make a successful request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Reset email sent' }),
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Failed to send reset email')).not.toBeInTheDocument();
    });
  });
}); 
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@components';
import { renderWithProviders } from '../utils/test-utils';

// Mock components
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock login logic
  };

  return (
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
  );
};

const ItemList = ({ items }) => (
  <div>
    {items.map(item => (
      <div key={item.id}>{item.name}</div>
    ))}
  </div>
);

describe('Integration Tests', () => {
  describe('Authentication Flow', () => {
    it('should complete login flow', async () => {
      renderWithProviders(<LoginForm />);

      // Fill in form
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' }
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
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'invalid@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'wrongpassword' }
      });

      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Data Management', () => {
    it('should load and display user list', async () => {
      renderWithProviders(<UserList />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
      });
    });

    it('should handle data loading errors', async () => {
      // Mock API error
      server.use(
        http.get('/api/users', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load users')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      renderWithProviders(<UserForm />);

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      renderWithProviders(<UserForm />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'invalid-email' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
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
        expect(screen.getByText('Home Page')).toBeInTheDocument();
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
});

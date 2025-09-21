import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@components';
import { Button, TextField, Card } from '@components';

// Test wrapper component
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Custom render function
export const renderWithProviders = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

// Test utilities
export const createMockUser = (overrides = {}) => ({
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'USER',
  isBanned: false,
  ...overrides
});

export const createMockVenue = (overrides = {}) => ({
  id: '1',
  name: 'Test Venue',
  address: '123 Test St',
  lat: 40.7128,
  lng: -74.0060,
  status: 'ACTIVE',
  ...overrides
});

export const createMockMatch = (overrides = {}) => ({
  id: '1',
  playerAId: '1',
  playerBId: '2',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  ...overrides
});

// Component tests
describe('UI Components', () => {
  describe('Button', () => {
    it('renders button with text', () => {
      renderWithProviders(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading state', () => {
      renderWithProviders(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('TextField', () => {
    it('renders text field with label', () => {
      renderWithProviders(<TextField label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('handles input changes', () => {
      const handleChange = vi.fn();
      renderWithProviders(<TextField onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test input' } });
      
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Card', () => {
    it('renders card with content', () => {
      renderWithProviders(
        <Card>
          <div>Card content</div>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });
  });
});

// Integration tests
describe('User Authentication', () => {
  it('should login user successfully', async () => {
    renderWithProviders(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });
  });
});

// Performance tests
describe('Performance', () => {
  it('should render large lists efficiently', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const start = performance.now();
    renderWithProviders(<ItemList items={items} />);
    const end = performance.now();

    expect(end - start).toBeLessThan(100); // Should render in under 100ms
  });
});

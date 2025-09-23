// UI Components test suite - Isolated from global test setup
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button, TextField, Card, ThemeProvider, createTheme } from '@mui/material';

// Create a simple theme for testing
const testTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

// Simple wrapper without complex providers
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={testTheme}>
    {children}
  </ThemeProvider>
);

// Custom render function
const renderWithTheme = (ui) => {
  return render(ui, { wrapper: TestWrapper });
};

// Note: Cleanup is handled automatically by vitest when globals: true

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
      renderWithTheme(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      renderWithTheme(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading state', () => {
      renderWithTheme(<Button disabled>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('TextField', () => {
    it('renders text field with label', () => {
      renderWithTheme(<TextField label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('handles input changes', () => {
      const handleChange = vi.fn();
      renderWithTheme(<TextField onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test input' } });

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Card', () => {
    it('renders card with content', () => {
      renderWithTheme(
        <Card>
          <div>Card content</div>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });
  });
});

// Integration tests
describe('Form Interactions', () => {
  it('should handle form submission with button and text field', () => {
    const handleSubmit = vi.fn();
    renderWithTheme(
      <form onSubmit={handleSubmit}>
        <TextField label="Name" defaultValue="John Doe" />
        <Button type="submit">Submit</Button>
      </form>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(handleSubmit).toHaveBeenCalled();
  });
});

// Performance tests
describe('Performance', () => {
  it('should render multiple cards efficiently', () => {
    const cards = Array.from({ length: 10 }, (_, i) => (
      <Card key={i}>
        <div>Card content {i}</div>
      </Card>
    ));

    const start = performance.now();
    renderWithTheme(<div>{cards}</div>);
    const end = performance.now();

    expect(end - start).toBeLessThan(50); // Should render in under 50ms
  });
});

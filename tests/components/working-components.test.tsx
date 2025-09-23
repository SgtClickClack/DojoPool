// Working UI Components test - No jest-dom, no globals
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  Button,
  TextField,
  Card,
  ThemeProvider,
  createTheme,
} from '@mui/material';

// Create a simple theme for testing
const testTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

// Simple wrapper
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={testTheme}>{children}</ThemeProvider>
);

// Custom render function
const renderWithTheme = (ui) => {
  return render(ui, { wrapper: TestWrapper });
};

// Setup and teardown
beforeEach(() => {
  // No global setup here
});

afterEach(() => {
  cleanup();
});

describe('Working UI Components', () => {
  describe('Button', () => {
    it('renders button with text', () => {
      renderWithTheme(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Click me');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      renderWithTheme(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows disabled state', () => {
      renderWithTheme(<Button disabled>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button.disabled).toBe(true);
    });
  });

  describe('TextField', () => {
    it('renders text field with label', () => {
      renderWithTheme(<TextField label="Test Label" />);
      const input = screen.getByLabelText('Test Label');
      expect(input).toBeTruthy();
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
      const content = screen.getByText('Card content');
      expect(content).toBeTruthy();
      expect(content.textContent).toBe('Card content');
    });
  });
});

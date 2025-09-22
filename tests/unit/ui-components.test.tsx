// Completely isolated UI Components test - no global setup
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  toBeInTheDocument,
  toBeDisabled,
} from '@testing-library/jest-dom/matchers';
import {
  Button,
  TextField,
  Card,
  ThemeProvider,
  createTheme,
} from '@mui/material';

// Extend expect with specific jest-dom matchers
expect.extend({
  toBeInTheDocument,
  toBeDisabled,
});

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

describe('Isolated UI Components', () => {
  describe('Button', () => {
    it('renders button with text', () => {
      renderWithTheme(<Button>Click me</Button>);
      expect(
        screen.getByRole('button', { name: 'Click me' })
      ).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      renderWithTheme(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows disabled state', () => {
      renderWithTheme(<Button disabled>Disabled</Button>);
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

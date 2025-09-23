// Simple UI Components test without complex setup
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
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

describe('Simple UI Components', () => {
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

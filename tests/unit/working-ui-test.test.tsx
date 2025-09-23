// Working UI Components test
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  Button,
  TextField,
  Card,
  ThemeProvider,
  createTheme,
} from '@mui/material';

const testTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={testTheme}>{children}</ThemeProvider>
);

const renderWithTheme = (ui) => {
  return render(ui, { wrapper: TestWrapper });
};

beforeEach(() => {
  // No global setup
});

afterEach(() => {
  cleanup();
});

describe('Working UI Components', () => {
  it('renders button', () => {
    renderWithTheme(<Button>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
  });
});

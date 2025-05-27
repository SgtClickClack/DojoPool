import React from 'react';
import { render, screen } from '@testing-library/react';
import WalletBalanceView from './WalletBalanceView';

// Mocking MUI components that might cause issues in Jest environment if not styled correctly
// Or if they have complex internal logic not relevant to this component's test.
// jest.mock('@mui/material', () => ({
//   ...jest.requireActual('@mui/material'),
//   Paper: ({ children, ...props }) => <div {...props}>{children}</div>,
//   Typography: ({ children, ...props }) => <div {...props}>{children}</div>,
//   Box: ({ children, ...props }) => <div {...props}>{children}</div>,
// }));

// Mock the hooks that would normally provide data
// We will control their return values in each test case
const mockUseAuth = jest.fn();
const mockUseWalletService = jest.fn();

jest.mock('../../hooks/services/useWalletService', () => ({
  __esModule: true,
  default: () => mockUseWalletService(),
}));

// Assuming useAuth might be used eventually, prepare a mock for it too.
jest.mock('../../contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
}));


describe('WalletBalanceView', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseAuth.mockReturnValue({ user: { id: 'test-user' } }); // Default auth mock
    mockUseWalletService.mockReturnValue({
      balance: null,
      loading: false,
      error: null,
    });
  });

  test('renders the title', () => {
    render(<WalletBalanceView />);
    expect(screen.getByText('Dojo Coin Balance')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mockUseWalletService.mockReturnValue({
      balance: null,
      loading: true,
      error: null,
    });
    render(<WalletBalanceView />);
    expect(screen.getByText('Loading balance...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    mockUseWalletService.mockReturnValue({
      balance: null,
      loading: false,
      error: 'Failed to load',
    });
    render(<WalletBalanceView />);
    expect(screen.getByText(/Error fetching balance: Failed to load/i)).toBeInTheDocument();
  });

  test('renders balance when data is available', () => {
    mockUseWalletService.mockReturnValue({
      balance: 1234.56,
      loading: false,
      error: null,
    });
    render(<WalletBalanceView />);
    // The component formats the number, so we check for parts of it or use a regex
    expect(screen.getByText("1,234.56")).toBeInTheDocument(); // Exact match for this format
    expect(screen.getByText('DOJO')).toBeInTheDocument();
  });

  test('renders message when balance is null and not loading/erroring', () => {
     mockUseWalletService.mockReturnValue({
      balance: null, // Explicitly null
      loading: false,
      error: null,
    });
    render(<WalletBalanceView />);
    expect(screen.getByText('No balance data available.')).toBeInTheDocument();
  });

}); 
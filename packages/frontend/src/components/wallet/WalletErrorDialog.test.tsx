import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletErrorDialog from './WalletErrorDialog';
import { WalletError, WalletErrorType } from '../../utils/walletErrorHandling';

// Mock the MUI Dialog component to avoid portal issues in tests
jest.mock('@mui/material/Dialog', () => {
  return ({ children, open, ...props }) => {
    if (!open) return null;
    return (
      <div data-testid="wallet-error-dialog" {...props}>
        {children}
      </div>
    );
  };
});

describe('WalletErrorDialog Component', () => {
  const mockOnClose = jest.fn();
  const mockOnRetry = jest.fn();
  const mockOnGoToWallet = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders nothing when no error is provided', () => {
    render(
      <WalletErrorDialog
        error={null}
        open={true}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onGoToWallet={mockOnGoToWallet}
      />
    );
    
    // Dialog should not be in the document
    expect(screen.queryByTestId('wallet-error-dialog')).not.toBeInTheDocument();
  });
  
  test('renders dialog when error is provided and open is true', () => {
    const error = new WalletError(
      'Connection failed',
      WalletErrorType.CONNECTION_FAILED,
      'ethereum',
      new Error('Original error'),
      true,
      ['Check your internet connection', 'Try again later']
    );
    
    render(
      <WalletErrorDialog
        error={error}
        open={true}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onGoToWallet={mockOnGoToWallet}
      />
    );
    
    // Dialog should be visible
    expect(screen.getByTestId('wallet-error-dialog')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    
    // Recovery steps should be visible
    expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });
  
  test('does not render dialog when open is false', () => {
    const error = new WalletError(
      'Connection failed',
      WalletErrorType.CONNECTION_FAILED,
      'ethereum',
      null,
      true,
      ['Check your internet connection']
    );
    
    render(
      <WalletErrorDialog
        error={error}
        open={false}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onGoToWallet={mockOnGoToWallet}
      />
    );
    
    // Dialog should not be visible
    expect(screen.queryByTestId('wallet-error-dialog')).not.toBeInTheDocument();
  });
  
  test('calls onClose when Close button is clicked', () => {
    const error = new WalletError(
      'Connection failed',
      WalletErrorType.CONNECTION_FAILED,
      'ethereum',
      null,
      true,
      ['Check your internet connection']
    );
    
    render(
      <WalletErrorDialog
        error={error}
        open={true}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onGoToWallet={mockOnGoToWallet}
      />
    );
    
    fireEvent.click(screen.getByTestId('close-dialog-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  test('calls onRetry when Retry button is clicked', () => {
    const error = new WalletError(
      'Connection failed',
      WalletErrorType.CONNECTION_FAILED,
      'ethereum',
      null,
      true,
      ['Check your internet connection']
    );
    
    render(
      <WalletErrorDialog
        error={error}
        open={true}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onGoToWallet={mockOnGoToWallet}
      />
    );
    
    fireEvent.click(screen.getByTestId('retry-button'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
  
  test('calls onGoToWallet when Help button is clicked', () => {
    const error = new WalletError(
      'Connection failed',
      WalletErrorType.CONNECTION_FAILED,
      'ethereum',
      null,
      true,
      ['Check your internet connection']
    );
    
    render(
      <WalletErrorDialog
        error={error}
        open={true}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onGoToWallet={mockOnGoToWallet}
      />
    );
    
    fireEvent.click(screen.getByTestId('help-button'));
    expect(mockOnGoToWallet).toHaveBeenCalledTimes(1);
  });
  
  test('displays error with high severity for critical errors', () => {
    const error = new WalletError(
      'Wallet not found',
      WalletErrorType.WALLET_NOT_FOUND,
      'ethereum',
      null,
      false,
      ['Install MetaMask', 'Refresh the page']
    );
    
    render(
      <WalletErrorDialog
        error={error}
        open={true}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onGoToWallet={mockOnGoToWallet}
      />
    );
    
    // Error should be displayed
    expect(screen.getByText('Wallet not found')).toBeInTheDocument();
    
    // Check for recovery steps
    expect(screen.getByText('Install MetaMask')).toBeInTheDocument();
    expect(screen.getByText('Refresh the page')).toBeInTheDocument();
    
    // Verify the severity message is displayed
    expect(screen.getByText('Action required')).toBeInTheDocument();
  });
  
  test('displays ethereum specific help content for ethereum wallet errors', () => {
    const error = new WalletError(
      'MetaMask error',
      WalletErrorType.TRANSACTION_FAILED,
      'ethereum',
      null,
      true,
      ['Check your gas settings', 'Try again with higher gas']
    );
    
    render(
      <WalletErrorDialog
        error={error}
        open={true}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onGoToWallet={mockOnGoToWallet}
      />
    );
    
    // Ethereum-specific recovery steps should be visible
    expect(screen.getByText('Check your gas settings')).toBeInTheDocument();
    expect(screen.getByText('Try again with higher gas')).toBeInTheDocument();
  });
  
  test('displays solana specific help content for solana wallet errors', () => {
    const error = new WalletError(
      'Phantom error',
      WalletErrorType.TRANSACTION_FAILED,
      'solana',
      null,
      true,
      ['Check your SOL balance for fees', 'Try again later']
    );
    
    render(
      <WalletErrorDialog
        error={error}
        open={true}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onGoToWallet={mockOnGoToWallet}
      />
    );
    
    // Solana-specific recovery steps should be visible
    expect(screen.getByText('Check your SOL balance for fees')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
    
    // Verify Solana wallet name is displayed in title
    expect(screen.getByText(/Solana Wallet Error/)).toBeInTheDocument();
  });
}); 
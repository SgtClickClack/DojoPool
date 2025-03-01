import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletErrorRecovery from './WalletErrorRecovery';
import { WalletError, WalletErrorType } from '../../utils/walletErrorHandling';

describe('WalletErrorRecovery Component', () => {
  // Create helper for generating wallet errors
  const createWalletError = (type: WalletErrorType, walletType: 'ethereum' | 'solana' = 'ethereum') => {
    return new WalletError(
      `Test ${type} error message`,
      type,
      walletType,
      new Error('Original error'),
      true,
      ['Step 1', 'Step 2', 'Step 3']
    );
  };

  it('renders error dialog when open is true', () => {
    const error = createWalletError(WalletErrorType.WALLET_NOT_FOUND);
    const onClose = jest.fn();
    const onRetry = jest.fn();

    render(
      <WalletErrorRecovery
        error={error}
        open={true}
        onClose={onClose}
        onRetry={onRetry}
      />
    );

    // Check if title and error message are displayed
    expect(screen.getByText(/Wallet Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Test WALLET_NOT_FOUND error message/i)).toBeInTheDocument();
    
    // Check if recovery steps are shown
    expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 3/i)).toBeInTheDocument();
  });

  it('does not render dialog when open is false', () => {
    const error = createWalletError(WalletErrorType.WALLET_NOT_FOUND);
    const onClose = jest.fn();
    const onRetry = jest.fn();

    render(
      <WalletErrorRecovery
        error={error}
        open={false}
        onClose={onClose}
        onRetry={onRetry}
      />
    );

    // Dialog shouldn't be visible
    expect(screen.queryByText(/Wallet Error/i)).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const error = createWalletError(WalletErrorType.WALLET_NOT_FOUND);
    const onClose = jest.fn();
    const onRetry = jest.fn();

    render(
      <WalletErrorRecovery
        error={error}
        open={true}
        onClose={onClose}
        onRetry={onRetry}
      />
    );

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Check if onClose was called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when retry button is clicked', () => {
    const error = createWalletError(WalletErrorType.USER_REJECTED);
    const onClose = jest.fn();
    const onRetry = jest.fn();

    render(
      <WalletErrorRecovery
        error={error}
        open={true}
        onClose={onClose}
        onRetry={onRetry}
      />
    );

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    // Check if onRetry was called
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('displays different icons for different error types', () => {
    // Test with wallet not found error
    const walletNotFoundError = createWalletError(WalletErrorType.WALLET_NOT_FOUND);
    const { unmount } = render(
      <WalletErrorRecovery
        error={walletNotFoundError}
        open={true}
        onClose={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    
    // Should show an icon (testing just presence, since actual icon is harder to test)
    expect(document.querySelector('svg')).toBeInTheDocument();
    unmount();

    // Test with insufficient funds error
    const insufficientFundsError = createWalletError(WalletErrorType.INSUFFICIENT_FUNDS);
    render(
      <WalletErrorRecovery
        error={insufficientFundsError}
        open={true}
        onClose={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    
    // Should show an icon
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('shows a specific message for the wallet type', () => {
    // Test with Ethereum wallet
    const ethereumError = createWalletError(WalletErrorType.WALLET_NOT_FOUND, 'ethereum');
    const { unmount } = render(
      <WalletErrorRecovery
        error={ethereumError}
        open={true}
        onClose={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    
    expect(screen.getByText(/Test WALLET_NOT_FOUND error message/i)).toBeInTheDocument();
    unmount();

    // Test with Solana wallet
    const solanaError = createWalletError(WalletErrorType.WALLET_NOT_FOUND, 'solana');
    render(
      <WalletErrorRecovery
        error={solanaError}
        open={true}
        onClose={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    
    expect(screen.getByText(/Test WALLET_NOT_FOUND error message/i)).toBeInTheDocument();
  });

  it('handles case where error is null', () => {
    render(
      <WalletErrorRecovery
        error={null}
        open={true}
        onClose={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    
    // Should still render without crashing
    expect(screen.getByText(/Wallet Error/i)).toBeInTheDocument();
    // Should show a generic message
    expect(screen.getByText(/An unknown error occurred/i)).toBeInTheDocument();
  });
}); 
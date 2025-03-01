import { toast } from 'react-toastify';

// Define error types for better error handling
export enum WalletErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  USER_REJECTED = 'USER_REJECTED',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
  ACCOUNT_ACCESS_REJECTED = 'ACCOUNT_ACCESS_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  SIGNATURE_FAILED = 'SIGNATURE_FAILED',
  CHAIN_SWITCH_FAILED = 'CHAIN_SWITCH_FAILED',
  UNKNOWN = 'UNKNOWN'
}

// Define wallet error class for structured error handling
export class WalletError extends Error {
  public type: WalletErrorType;
  public originalError: any;
  public walletType: 'ethereum' | 'solana';
  public recoverable: boolean;
  public recoverySteps?: string[];

  constructor(
    message: string,
    type: WalletErrorType = WalletErrorType.UNKNOWN,
    walletType: 'ethereum' | 'solana',
    originalError?: any,
    recoverable: boolean = true,
    recoverySteps?: string[]
  ) {
    super(message);
    this.name = 'WalletError';
    this.type = type;
    this.walletType = walletType;
    this.originalError = originalError;
    this.recoverable = recoverable;
    this.recoverySteps = recoverySteps;
  }
}

// Error detection utility functions
export const detectEthereumError = (error: any): WalletErrorType => {
  // Check error code for MetaMask and other EIP-1193 compatible wallets
  if (error && typeof error === 'object') {
    // Standard MetaMask error codes
    if (error.code) {
      switch (error.code) {
        case 4001:
          return WalletErrorType.USER_REJECTED;
        case 4100:
          return WalletErrorType.ACCOUNT_ACCESS_REJECTED;
        case 4200:
          return WalletErrorType.UNSUPPORTED_CHAIN;
        case 4900:
          return WalletErrorType.WALLET_NOT_FOUND;
        case 4901:
          return WalletErrorType.WALLET_NOT_FOUND;
        case -32603:
          if (error.message && error.message.includes('insufficient funds')) {
            return WalletErrorType.INSUFFICIENT_FUNDS;
          }
          return WalletErrorType.TRANSACTION_FAILED;
      }
    }

    // Error message pattern matching
    if (error.message) {
      const message = error.message.toLowerCase();
      if (message.includes('user rejected') || message.includes('user denied')) {
        return WalletErrorType.USER_REJECTED;
      }
      if (message.includes('insufficient funds')) {
        return WalletErrorType.INSUFFICIENT_FUNDS;
      }
      if (message.includes('network') || message.includes('connection')) {
        return WalletErrorType.NETWORK_ERROR;
      }
      if (message.includes('chain') && message.includes('switch')) {
        return WalletErrorType.CHAIN_SWITCH_FAILED;
      }
      if (message.includes('signature')) {
        return WalletErrorType.SIGNATURE_FAILED;
      }
    }
  }

  return WalletErrorType.UNKNOWN;
};

export const detectSolanaError = (error: any): WalletErrorType => {
  if (error && typeof error === 'object') {
    // Error message pattern matching for Solana
    if (error.message) {
      const message = error.message.toLowerCase();
      if (message.includes('user rejected') || message.includes('declined')) {
        return WalletErrorType.USER_REJECTED;
      }
      if (message.includes('wallet not found') || message.includes('no provider')) {
        return WalletErrorType.WALLET_NOT_FOUND;
      }
      if (message.includes('insufficient') || message.includes('enough fund')) {
        return WalletErrorType.INSUFFICIENT_FUNDS;
      }
      if (message.includes('network') || message.includes('connection')) {
        return WalletErrorType.NETWORK_ERROR;
      }
      if (message.includes('signature')) {
        return WalletErrorType.SIGNATURE_FAILED;
      }
    }
  }

  return WalletErrorType.UNKNOWN;
};

// Get user-friendly error message and recovery steps
export const getWalletErrorDetails = (
  errorType: WalletErrorType,
  walletType: 'ethereum' | 'solana'
): { message: string; recoverable: boolean; recoverySteps: string[] } => {
  const wallet = walletType === 'ethereum' ? 'Ethereum' : 'Solana';
  
  switch (errorType) {
    case WalletErrorType.WALLET_NOT_FOUND:
      return {
        message: `${wallet} wallet not detected. Please install a compatible wallet.`,
        recoverable: false,
        recoverySteps: [
          walletType === 'ethereum' 
            ? 'Install MetaMask from metamask.io'
            : 'Install Phantom Wallet from phantom.app',
          'Refresh the page after installation',
        ]
      };
    
    case WalletErrorType.USER_REJECTED:
      return {
        message: `You declined the connection request. Please approve to connect your ${wallet} wallet.`,
        recoverable: true,
        recoverySteps: [
          'Try connecting again',
          'Approve the request in your wallet'
        ]
      };
    
    case WalletErrorType.ACCOUNT_ACCESS_REJECTED:
      return {
        message: `Access to your ${wallet} accounts was denied. The app needs access to function properly.`,
        recoverable: true,
        recoverySteps: [
          'Try connecting again',
          'Grant permission to view your wallet address'
        ]
      };
    
    case WalletErrorType.UNSUPPORTED_CHAIN:
      return {
        message: `The selected network is not supported. Please switch to a supported network.`,
        recoverable: true,
        recoverySteps: [
          walletType === 'ethereum' 
            ? 'Switch to Ethereum Mainnet or a supported testnet'
            : 'Switch to Solana Mainnet or Devnet',
          'Then try connecting again'
        ]
      };
    
    case WalletErrorType.NETWORK_ERROR:
      return {
        message: `Network error. Please check your internet connection and try again.`,
        recoverable: true,
        recoverySteps: [
          'Check your internet connection',
          'Verify if the blockchain network is operational',
          'Try again in a few minutes'
        ]
      };
    
    case WalletErrorType.INSUFFICIENT_FUNDS:
      return {
        message: `Insufficient funds in your ${wallet} wallet for this transaction.`,
        recoverable: false,
        recoverySteps: [
          `Add more funds to your ${wallet} wallet`,
          'Try a smaller transaction amount'
        ]
      };
    
    case WalletErrorType.TRANSACTION_FAILED:
      return {
        message: `Transaction failed. Please check the details and try again.`,
        recoverable: true,
        recoverySteps: [
          'Check transaction parameters',
          'Verify the recipient address',
          'Ensure you have sufficient funds (including gas fees for Ethereum)'
        ]
      };
    
    case WalletErrorType.SIGNATURE_FAILED:
      return {
        message: `Message signing failed. Please try again.`,
        recoverable: true,
        recoverySteps: [
          'Try signing again',
          'Ensure your wallet is unlocked',
          'Check if your wallet supports message signing'
        ]
      };
    
    case WalletErrorType.CHAIN_SWITCH_FAILED:
      return {
        message: `Failed to switch network. Please switch manually in your wallet.`,
        recoverable: true,
        recoverySteps: [
          'Open your wallet extension',
          'Switch to the required network manually',
          'Refresh the page and try again'
        ]
      };
    
    case WalletErrorType.CONNECTION_FAILED:
      return {
        message: `Failed to connect to ${wallet} wallet. Please try again.`,
        recoverable: true,
        recoverySteps: [
          'Ensure your wallet is unlocked',
          'Refresh the page and try again',
          'Check if your wallet is up to date'
        ]
      };
    
    case WalletErrorType.UNKNOWN:
    default:
      return {
        message: `An unexpected error occurred with your ${wallet} wallet.`,
        recoverable: true,
        recoverySteps: [
          'Refresh the page and try again',
          'Ensure your wallet is up to date',
          'Check if the blockchain network is experiencing issues'
        ]
      };
  }
};

// Main error handler function
export const handleWalletError = (
  error: any,
  walletType: 'ethereum' | 'solana',
  operation: string = 'wallet operation'
): WalletError => {
  console.error(`Error during ${operation} with ${walletType} wallet:`, error);
  
  const errorType = walletType === 'ethereum' 
    ? detectEthereumError(error) 
    : detectSolanaError(error);
    
  const { message, recoverable, recoverySteps } = getWalletErrorDetails(errorType, walletType);
  
  // Create structured error
  const walletError = new WalletError(
    message,
    errorType,
    walletType,
    error,
    recoverable,
    recoverySteps
  );
  
  // Show toast notification
  toast.error(message, {
    autoClose: 5000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
  
  return walletError;
};

// Recovery helper component interface
export interface WalletErrorRecoveryOptions {
  error: WalletError;
  onRetry?: () => void;
  onClose?: () => void;
} 
import { 
  WalletErrorType, 
  WalletError, 
  handleWalletError,
  getWalletErrorDetails 
} from './walletErrorHandling';

describe('Wallet Error Handling Utilities', () => {
  describe('WalletError class', () => {
    it('should create a wallet error with the correct properties', () => {
      const error = new WalletError(
        'MetaMask wallet not found',
        WalletErrorType.WALLET_NOT_FOUND,
        'ethereum',
        new Error('Original error'),
        true,
        ['Try installing MetaMask']
      );

      expect(error.type).toBe(WalletErrorType.WALLET_NOT_FOUND);
      expect(error.message).toBe('MetaMask wallet not found');
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.walletType).toBe('ethereum');
      expect(error.recoverable).toBeTruthy();
      expect(error.recoverySteps).toContain('Try installing MetaMask');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create a wallet error with default values', () => {
      const error = new WalletError('Connection was rejected', WalletErrorType.USER_REJECTED, 'ethereum');

      expect(error.type).toBe(WalletErrorType.USER_REJECTED);
      expect(error.message).toBe('Connection was rejected');
      expect(error.originalError).toBeUndefined();
      expect(error.walletType).toBe('ethereum');
      expect(error.recoverable).toBeTruthy();
      expect(error.recoverySteps).toBeUndefined();
    });
  });

  describe('handleWalletError function', () => {
    it('should create and return a WalletError for a regular Error', () => {
      const originalError = new Error('Something went wrong');
      const walletError = handleWalletError(originalError, 'ethereum', 'connecting');
      
      expect(walletError).toBeInstanceOf(WalletError);
      expect(walletError.type).toBe(WalletErrorType.UNKNOWN);
      expect(walletError.walletType).toBe('ethereum');
      expect(walletError.originalError).toBe(originalError);
    });

    it('should detect and categorize Ethereum errors', () => {
      const ethRejectionError = { code: 4001, message: 'User rejected the request' };
      const walletError = handleWalletError(ethRejectionError, 'ethereum', 'transaction');
      
      expect(walletError.type).toBe(WalletErrorType.USER_REJECTED);
      expect(walletError.walletType).toBe('ethereum');
      expect(walletError.originalError).toBe(ethRejectionError);
    });

    it('should detect and categorize Solana errors', () => {
      const solanaError = { message: 'User declined to sign the transaction' };
      const walletError = handleWalletError(solanaError, 'solana', 'signing');
      
      expect(walletError.type).toBe(WalletErrorType.USER_REJECTED);
      expect(walletError.walletType).toBe('solana');
      expect(walletError.originalError).toBe(solanaError);
    });
  });

  describe('getWalletErrorDetails function', () => {
    it('should return error details for WALLET_NOT_FOUND error', () => {
      const details = getWalletErrorDetails(WalletErrorType.WALLET_NOT_FOUND, 'ethereum');
      
      expect(details.message).toContain('Ethereum wallet not detected');
      expect(details.recoverable).toBeFalsy();
      expect(details.recoverySteps.length).toBeGreaterThan(0);
      expect(details.recoverySteps[0]).toContain('MetaMask');
    });

    it('should return error details for USER_REJECTED error', () => {
      const details = getWalletErrorDetails(WalletErrorType.USER_REJECTED, 'ethereum');
      
      expect(details.message).toContain('declined the connection request');
      expect(details.recoverable).toBeTruthy();
      expect(details.recoverySteps.length).toBeGreaterThan(0);
      expect(details.recoverySteps).toContainEqual(expect.stringContaining('Try connecting again'));
    });

    it('should return error details for ACCOUNT_ACCESS_REJECTED error', () => {
      const details = getWalletErrorDetails(WalletErrorType.ACCOUNT_ACCESS_REJECTED, 'solana');
      
      expect(details.message).toContain('Access to your Solana accounts was denied');
      expect(details.recoverable).toBeTruthy();
      expect(details.recoverySteps.length).toBeGreaterThan(0);
      expect(details.recoverySteps).toContainEqual(expect.stringContaining('Grant permission'));
    });

    it('should return error details for NETWORK_ERROR error', () => {
      const details = getWalletErrorDetails(WalletErrorType.NETWORK_ERROR, 'ethereum');
      
      expect(details.message).toContain('Network error');
      expect(details.recoverable).toBeTruthy();
      expect(details.recoverySteps.length).toBeGreaterThan(0);
      expect(details.recoverySteps).toContainEqual(expect.stringContaining('internet connection'));
    });

    it('should return error details for INSUFFICIENT_FUNDS error', () => {
      const details = getWalletErrorDetails(WalletErrorType.INSUFFICIENT_FUNDS, 'ethereum');
      
      expect(details.message).toContain('Insufficient funds');
      expect(details.recoverable).toBeFalsy();
      expect(details.recoverySteps.length).toBeGreaterThan(0);
      expect(details.recoverySteps).toContainEqual(expect.stringContaining('Add more funds'));
    });

    it('should return error details for TRANSACTION_FAILED error', () => {
      const details = getWalletErrorDetails(WalletErrorType.TRANSACTION_FAILED, 'ethereum');
      
      expect(details.message).toContain('Transaction failed');
      expect(details.recoverable).toBeTruthy();
      expect(details.recoverySteps.length).toBeGreaterThan(0);
      expect(details.recoverySteps).toContainEqual(expect.stringContaining('Check transaction parameters'));
    });

    it('should return error details for CHAIN_SWITCH_FAILED error', () => {
      const details = getWalletErrorDetails(WalletErrorType.CHAIN_SWITCH_FAILED, 'ethereum');
      
      expect(details.message).toContain('Failed to switch network');
      expect(details.recoverable).toBeTruthy();
      expect(details.recoverySteps.length).toBeGreaterThan(0);
      expect(details.recoverySteps).toContainEqual(expect.stringContaining('manually'));
    });

    it('should return generic error details for UNKNOWN error', () => {
      const details = getWalletErrorDetails(WalletErrorType.UNKNOWN, 'ethereum');
      
      expect(details.message).toContain('unexpected error');
      expect(details.recoverable).toBeTruthy();
      expect(details.recoverySteps.length).toBeGreaterThan(0);
      expect(details.recoverySteps).toContainEqual(expect.stringContaining('Refresh'));
    });

    it('should customize details based on the wallet type for Ethereum', () => {
      const details = getWalletErrorDetails(WalletErrorType.WALLET_NOT_FOUND, 'ethereum');
      
      expect(details.message).toContain('Ethereum wallet');
      expect(details.recoverySteps).toContainEqual(expect.stringContaining('MetaMask'));
    });

    it('should customize details based on the wallet type for Solana', () => {
      const details = getWalletErrorDetails(WalletErrorType.WALLET_NOT_FOUND, 'solana');
      
      expect(details.message).toContain('Solana wallet');
      expect(details.recoverySteps).toContainEqual(expect.stringContaining('Phantom'));
    });
  });
}); 
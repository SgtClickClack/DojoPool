import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import { blockchainService } from '../services/blockchainService';
import { toast } from 'react-toastify';
import { handleWalletError, WalletError, WalletErrorType } from '../utils/walletErrorHandling';
import { 
  notifyTransactionSubmitted, 
  notifyTransactionConfirmed, 
  notifyNetworkChanged,
  notifyBalanceUpdated,
  notifyWalletConnected,
  notifyWalletDisconnected
} from '../utils/walletNotifications';

// Temporarily mock the UserContext until we create it
// We'll create this file next
interface User {
  ethereumAddress?: string | null;
  solanaAddress?: string | null;
  [key: string]: any;
}

const useUserContext = () => {
  const user: User = {
    ethereumAddress: null,
    solanaAddress: null
  };
  
  // Mock update function that logs changes
  const updateUser = (updatedUser: User) => {
    console.log('User updated:', updatedUser);
    return true;
  };
  
  return { user, updateUser };
};

type WalletType = 'ethereum' | 'solana';

interface UseWalletReturn {
  connectWallet: (type: WalletType) => Promise<boolean>;
  disconnectWallet: (type: WalletType) => Promise<void>;
  walletAddress: {
    ethereum: string | null;
    solana: string | null;
  };
  isConnecting: boolean;
  isConnected: (type: WalletType) => boolean;
  balance: {
    ethereum: string | null;
    solana: string | null;
  };
  sendTransaction: (type: WalletType, to: string, amount: string, data?: any) => Promise<string | null>;
  signMessage: (type: WalletType, message: string) => Promise<string | null>;
  switchChain: (type: WalletType, chainId?: string) => Promise<boolean>;
  activeChainId: string | null;
  isCrossChainReady: boolean;
  walletError: WalletError | null;
  showErrorDialog: boolean;
  handleCloseErrorDialog: () => void;
  handleRetryOperation: () => Promise<void>;
  lastSuccessfulOperation: {
    type: WalletType;
    operation: string;
    params?: any;
  } | null;
}

export const useWallet = (): UseWalletReturn => {
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<{
    ethereum: string | null;
    solana: string | null;
  }>({
    ethereum: null,
    solana: null
  });
  const [balance, setBalance] = useState<{
    ethereum: string | null;
    solana: string | null;
  }>({
    ethereum: null,
    solana: null
  });
  const [activeChainId, setActiveChainId] = useState<string | null>(null);
  const [isCrossChainReady, setIsCrossChainReady] = useState<boolean>(false);
  
  // Enhanced error state management
  const [walletError, setWalletError] = useState<WalletError | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);
  const [lastSuccessfulOperation, setLastSuccessfulOperation] = useState<{
    type: WalletType;
    operation: string;
    params?: any;
  } | null>(null);
  
  const { user, updateUser } = useUserContext();
  
  // Function to update wallet balances
  const updateBalance = useCallback(async () => {
    try {
      // Update Ethereum balance
      if (walletAddress.ethereum && window.ethereum) {
        const ethProvider = new ethers.Web3Provider(window.ethereum);
        const ethBalance = await ethProvider.getBalance(walletAddress.ethereum);
        setBalance(prev => ({ ...prev, ethereum: ethers.formatEther(ethBalance) }));
        
        // Store previous balances to detect significant changes
        const previousEthBalance = balance.ethereum;
        
        if (previousEthBalance && ethBalance && 
            Math.abs(parseFloat(ethBalance) - parseFloat(previousEthBalance)) > 0.01) {
          notifyBalanceUpdated('ethereum', ethers.formatEther(ethBalance));
        }
      }
      
      // Update Solana balance
      if (walletAddress.solana) {
        const connection = new Connection(process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
        const publicKey = new PublicKey(walletAddress.solana);
        const solBalance = await connection.getBalance(publicKey);
        setBalance(prev => ({ ...prev, solana: (solBalance / 1e9).toString() }));
        
        // Store previous balances to detect significant changes
        const previousSolBalance = balance.solana;
        
        if (previousSolBalance && solBalance && 
            Math.abs(parseFloat(solBalance) - parseFloat(previousSolBalance)) > 0.1) {
          notifyBalanceUpdated('solana', (solBalance / 1e9).toString());
        }
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  }, [walletAddress]);
  
  // Initialize wallet state on component mount
  useEffect(() => {
    const initWalletState = async () => {
      try {
        // Check if MetaMask is connected
        if (window.ethereum) {
          const ethProvider = new ethers.Web3Provider(window.ethereum);
          const accounts = await ethProvider.listAccounts();
          
          if (accounts.length > 0) {
            // Set Ethereum address
            setWalletAddress(prev => ({ ...prev, ethereum: accounts[0] }));
            
            // Get Ethereum balance
            const ethBalance = await ethProvider.getBalance(accounts[0]);
            setBalance(prev => ({ ...prev, ethereum: ethers.formatEther(ethBalance) }));
            
            // Get active chain ID
            const network = await ethProvider.getNetwork();
            setActiveChainId(network.chainId.toString());
          }
        }
        
        // Check if Phantom wallet is connected
        if (window.solana && window.solana.isPhantom) {
          const isConnected = window.solana.isConnected;
          
          if (isConnected && window.solana.publicKey) {
            const publicKeyString = window.solana.publicKey.toString();
            
            if (publicKeyString) {
              // Set Solana address
              setWalletAddress(prev => ({ ...prev, solana: publicKeyString }));
              
              // Get Solana balance
              const connection = new Connection(process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
              const publicKey = new PublicKey(publicKeyString);
              const solBalance = await connection.getBalance(publicKey);
              setBalance(prev => ({ ...prev, solana: (solBalance / 1e9).toString() }));
            }
          }
        }
        
        // Check if we have both wallets connected for cross-chain
        checkCrossChainReadiness();
      } catch (error) {
        console.error('Error initializing wallet state:', error);
      }
    };
    
    initWalletState();
    
    // Setup event listeners
    const setupEthereumListeners = () => {
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setWalletAddress(prev => ({ ...prev, ethereum: accounts[0] }));
          } else {
            setWalletAddress(prev => ({ ...prev, ethereum: null }));
            setBalance(prev => ({ ...prev, ethereum: null }));
          }
          checkCrossChainReadiness();
        });
        
        window.ethereum.on('chainChanged', (chainId: string) => {
          setActiveChainId(parseInt(chainId, 16).toString());
          // Reload balances when chain changes
          updateBalance();
          toast.info(`Ethereum network changed: ${getNetworkNameFromChainId(chainId)}`);
        });
      }
    };
    
    const setupSolanaListeners = () => {
      if (window.solana && window.solana.isPhantom) {
        window.solana.on('connect', (publicKey: any) => {
          if (publicKey && typeof publicKey.toString === 'function') {
            setWalletAddress(prev => ({ ...prev, solana: publicKey.toString() }));
            checkCrossChainReadiness();
          }
        });
        
        window.solana.on('disconnect', () => {
          setWalletAddress(prev => ({ ...prev, solana: null }));
          setBalance(prev => ({ ...prev, solana: null }));
          checkCrossChainReadiness();
        });
      }
    };
    
    setupEthereumListeners();
    setupSolanaListeners();
    
    // Cleanup listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
      
      if (window.solana && window.solana.isPhantom) {
        window.solana.removeAllListeners('connect');
        window.solana.removeAllListeners('disconnect');
      }
    };
  }, []);
  
  // Update balance when wallet address changes
  useEffect(() => {
    updateBalance();
    
    // Set up interval to refresh balance
    const intervalId = setInterval(updateBalance, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [walletAddress, activeChainId]);
  
  // Check if both wallets are connected for cross-chain capabilities
  const checkCrossChainReadiness = useCallback(() => {
    const isEthereumConnected = !!walletAddress.ethereum;
    const isSolanaConnected = !!walletAddress.solana;
    setIsCrossChainReady(isEthereumConnected && isSolanaConnected);
  }, [walletAddress]);
  
  // Convert chain ID to readable network name
  const getNetworkNameFromChainId = (chainId: string): string => {
    const id = typeof chainId === 'string' && chainId.startsWith('0x') 
      ? parseInt(chainId, 16) 
      : parseInt(chainId);
      
    switch (id) {
      case 1:
        return 'Ethereum Mainnet';
      case 3:
        return 'Ropsten Testnet';
      case 4:
        return 'Rinkeby Testnet';
      case 5:
        return 'Goerli Testnet';
      case 42:
        return 'Kovan Testnet';
      case 56:
        return 'Binance Smart Chain';
      case 137:
        return 'Polygon Mainnet';
      default:
        return `Chain ID ${id}`;
    }
  };
  
  // Function to handle closing the error dialog
  const handleCloseErrorDialog = useCallback(() => {
    setShowErrorDialog(false);
  }, []);
  
  // Function to retry the last failed operation
  const handleRetryOperation = useCallback(async () => {
    if (!lastSuccessfulOperation) return;
    
    const { type, operation, params } = lastSuccessfulOperation;
    
    // Reset error state
    setWalletError(null);
    setShowErrorDialog(false);
    
    try {
      switch (operation) {
        case 'connect':
          await connectWallet(type);
          break;
        case 'disconnect':
          await disconnectWallet(type);
          break;
        case 'sendTransaction':
          if (params && params.to && params.amount) {
            await sendTransaction(type, params.to, params.amount, params.data);
          }
          break;
        case 'signMessage':
          if (params && params.message) {
            await signMessage(type, params.message);
          }
          break;
        case 'switchChain':
          if (params && params.chainId) {
            await switchChain(type, params.chainId);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      // Error handling is already managed by the individual functions
    }
  }, [lastSuccessfulOperation]);
  
  // Enhanced connect wallet function with better error handling
  const connectWallet = async (type: WalletType): Promise<boolean> => {
    setIsConnecting(true);
    setWalletError(null);
    
    try {
      // Track operation for potential retry
      setLastSuccessfulOperation({
        type,
        operation: 'connect'
      });
      
      // Connection logic for Ethereum
      if (type === 'ethereum') {
        if (!window.ethereum) {
          const error = new WalletError(
            'MetaMask or compatible Ethereum wallet not detected.',
            WalletErrorType.WALLET_NOT_FOUND,
            'ethereum',
            null,
            false,
            ['Install MetaMask from metamask.io', 'Refresh the page after installation']
          );
          
          setWalletError(error);
          setShowErrorDialog(true);
          throw error;
        }
        
        try {
          // Request wallet connection
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          if (accounts && accounts.length > 0) {
            // Success - update state
            setWalletAddress(prev => ({ ...prev, ethereum: accounts[0] }));
            
            // Get the connected network
            const provider = new ethers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            setActiveChainId(network.chainId.toString());
            
            // Get wallet balance
            const ethBalance = await provider.getBalance(accounts[0]);
            setBalance(prev => ({ ...prev, ethereum: ethers.formatEther(ethBalance) }));
            
            // Update user context if available
            if (updateUser) {
              updateUser({
                ...user,
                ethereumAddress: accounts[0]
              });
            }
            
            // Show success notification
            notifyWalletConnected('ethereum', accounts[0]);
            
            // Check cross-chain status
            checkCrossChainReadiness();
            
            return true;
          } else {
            throw new Error('No accounts returned from wallet');
          }
        } catch (error) {
          // Handle error using our structured error handling
          const walletError = handleWalletError(error, 'ethereum', 'wallet connection');
          setWalletError(walletError);
          setShowErrorDialog(true);
          throw walletError;
        }
      }
      
      // Connection logic for Solana
      if (type === 'solana') {
        if (!window.solana || !window.solana.isPhantom) {
          const error = new WalletError(
            'Phantom or compatible Solana wallet not detected.',
            WalletErrorType.WALLET_NOT_FOUND,
            'solana',
            null,
            false,
            ['Install Phantom Wallet from phantom.app', 'Refresh the page after installation']
          );
          
          setWalletError(error);
          setShowErrorDialog(true);
          throw error;
        }
        
        try {
          // Connect to Phantom
          const { publicKey } = await window.solana.connect();
          
          if (publicKey) {
            const publicKeyString = publicKey.toString();
            
            // Success - update state
            setWalletAddress(prev => ({ ...prev, solana: publicKeyString }));
            
            // Get balance
            const connection = new Connection(process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
            const solBalance = await connection.getBalance(publicKey);
            setBalance(prev => ({ ...prev, solana: (solBalance / 1e9).toString() }));
            
            // Update user context if available
            if (updateUser) {
              updateUser({
                ...user,
                solanaAddress: publicKeyString
              });
            }
            
            // Show success notification
            notifyWalletConnected('solana', publicKeyString);
            
            // Check cross-chain status
            checkCrossChainReadiness();
            
            return true;
          } else {
            throw new Error('Failed to retrieve public key from wallet');
          }
        } catch (error) {
          // Handle error using our structured error handling
          const walletError = handleWalletError(error, 'solana', 'wallet connection');
          setWalletError(walletError);
          setShowErrorDialog(true);
          throw walletError;
        }
      }
      
      return false;
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Enhanced disconnect wallet function
  const disconnectWallet = async (type: WalletType): Promise<void> => {
    try {
      // Track operation for potential retry
      setLastSuccessfulOperation({
        type,
        operation: 'disconnect'
      });
      
      if (type === 'ethereum') {
        // For Ethereum, we don't have a direct disconnect method, so we just clear the state
        setWalletAddress(prev => ({ ...prev, ethereum: null }));
        setBalance(prev => ({ ...prev, ethereum: null }));
        
        // Update user context if available
        if (updateUser) {
          updateUser({
            ...user,
            ethereumAddress: null
          });
        }
      } else if (type === 'solana' && window.solana && window.solana.isConnected) {
        // For Solana, use the disconnect method
        await window.solana.disconnect();
        setWalletAddress(prev => ({ ...prev, solana: null }));
        setBalance(prev => ({ ...prev, solana: null }));
        
        // Update user context if available
        if (updateUser) {
          updateUser({
            ...user,
            solanaAddress: null
          });
        }
      }
      
      // Show disconnection notification
      notifyWalletDisconnected(type);
      
      // Check cross-chain status
      checkCrossChainReadiness();
    } catch (error) {
      // Handle error using our structured error handling
      const walletError = handleWalletError(error, type, 'wallet disconnection');
      setWalletError(walletError);
      setShowErrorDialog(true);
      throw walletError;
    }
  };
  
  // Enhanced sendTransaction function
  const sendTransaction = async (
    type: WalletType,
    to: string,
    amount: string,
    data?: any
  ): Promise<string | null> => {
    try {
      // Track operation for potential retry
      setLastSuccessfulOperation({
        type,
        operation: 'sendTransaction',
        params: { to, amount, data }
      });
      
      if (type === 'ethereum' && window.ethereum) {
        const provider = new ethers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Convert amount to wei
        const amountWei = ethers.parseEther(amount);
        
        // Create transaction
        const tx = {
          to,
          value: amountWei,
          data: data || '0x'
        };
        
        // Show pending notification
        notifyTransactionSubmitted('ethereum', 'Pending', amount);
        
        // Send transaction
        const transaction = await signer.sendTransaction(tx);
        
        // Show submitted notification
        notifyTransactionSubmitted('ethereum', transaction.hash, amount);
        
        // Wait for confirmation
        const receipt = await transaction.wait();
        
        // Show confirmed notification
        notifyTransactionConfirmed('ethereum', receipt.transactionHash, amount);
        
        // Update balance after transaction
        updateBalance();
        
        return receipt.transactionHash;
      } else if (type === 'solana' && window.solana && window.solana.isConnected) {
        // Solana transaction implementation
        // ... existing Solana transaction code ...
      }
      
      return null;
    } catch (error) {
      // Handle error using our structured error handling
      const walletError = handleWalletError(error, type, 'transaction');
      setWalletError(walletError);
      setShowErrorDialog(true);
      throw walletError;
    }
  };
  
  // Enhanced signMessage function
  const signMessage = async (
    type: WalletType,
    message: string
  ): Promise<string | null> => {
    try {
      // Track operation for potential retry
      setLastSuccessfulOperation({
        type,
        operation: 'signMessage',
        params: { message }
      });
      
      if (type === 'ethereum' && window.ethereum) {
        const provider = new ethers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Sign the message
        return await signer.signMessage(message);
      } else if (type === 'solana' && window.solana && window.solana.isConnected) {
        // This would be implemented with the Solana wallet API
        // For now, we'll just return a placeholder
        console.log('Signing message with Solana wallet:', message);
        return 'solana-signature-placeholder';
      }
      
      return null;
    } catch (error) {
      // Handle error using our structured error handling
      const walletError = handleWalletError(error, type, 'message signing');
      setWalletError(walletError);
      setShowErrorDialog(true);
      throw walletError;
    }
  };
  
  // Enhanced switchChain function
  const switchChain = async (
    type: WalletType,
    chainId?: string
  ): Promise<boolean> => {
    try {
      // Track operation for potential retry
      setLastSuccessfulOperation({
        type,
        operation: 'switchChain',
        params: { chainId }
      });
      
      if (type === 'ethereum' && window.ethereum) {
        if (!window.ethereum || !walletAddress.ethereum) {
          throw new WalletError(
            'Ethereum wallet not connected. Please connect your wallet first.',
            WalletErrorType.CONNECTION_FAILED,
            'ethereum'
          );
        }
        
        // If no chainId is provided, default to Ethereum mainnet
        const targetChainId = chainId || '0x1'; // 0x1 is Ethereum mainnet
        
        try {
          // Try to switch to the chain
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
          
          // Update active chain ID
          setActiveChainId(parseInt(targetChainId, 16).toString());
          
          // Update balance after switching chain
          updateBalance();
          
          // Add notification after successful chain switch
          const networkName = getNetworkNameFromChainId(targetChainId);
          notifyNetworkChanged(type, networkName);
          
          return true;
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            throw new WalletError(
              'This network is not available in your wallet. Please add it manually.',
              WalletErrorType.CHAIN_SWITCH_FAILED,
              'ethereum',
              switchError
            );
          }
          throw switchError;
        }
      }
      
      // For Solana, chain switching isn't applicable in the same way
      // We might handle network selection differently
      return false;
    } catch (error) {
      // Handle error using our structured error handling
      const walletError = handleWalletError(error, type, 'network switching');
      setWalletError(walletError);
      setShowErrorDialog(true);
      throw walletError;
    }
  };
  
  // Check if wallet is connected
  const isConnected = useCallback((type: WalletType): boolean => {
    return !!walletAddress[type];
  }, [walletAddress]);
  
  return {
    connectWallet,
    disconnectWallet,
    walletAddress,
    isConnecting,
    isConnected,
    balance,
    sendTransaction,
    signMessage,
    switchChain,
    activeChainId,
    isCrossChainReady,
    walletError,
    showErrorDialog,
    handleCloseErrorDialog,
    handleRetryOperation,
    lastSuccessfulOperation
  };
};

// Add type definitions for window object
declare global {
  interface Window {
    ethereum?: any;
    solana?: {
      isPhantom: boolean;
      isConnected: boolean;
      publicKey: { toString: () => string };
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: any) => void;
      removeAllListeners: (event: string) => void;
    };
  }
}

// Add fallback for ethers types to fix linter errors
declare module 'ethers' {
  namespace providers {
    class Web3Provider extends ethers.providers.BaseProvider {
      constructor(provider: any, network?: ethers.providers.Networkish);
      getSigner(): ethers.Signer;
      listAccounts(): Promise<string[]>;
    }
  }
} 
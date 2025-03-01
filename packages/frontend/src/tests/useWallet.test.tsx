// @jest-environment jsdom
import { render, screen, act, renderHook } from '@testing-library/react';
import { useWallet } from '../hooks/useWallet';
import { UserProvider } from '../contexts/UserContext';
import React from 'react';

// Mock window.ethereum and window.solana
global.window.ethereum = {
  isMetaMask: true,
  request: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  send: jest.fn()
};

global.window.solana = {
  isPhantom: true,
  isConnected: false,
  publicKey: null,
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn()
};

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    providers: {
      Web3Provider: jest.fn().mockImplementation(() => ({
        listAccounts: jest.fn().mockResolvedValue(['0x123456789abcdef']),
        getBalance: jest.fn().mockResolvedValue({ _hex: '0x64' }),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
        getSigner: jest.fn().mockImplementation(() => ({
          sendTransaction: jest.fn().mockResolvedValue({
            wait: jest.fn().mockResolvedValue({ transactionHash: '0xmocktxhash' })
          }),
          signMessage: jest.fn().mockResolvedValue('0xmocksignature')
        })),
        send: jest.fn().mockResolvedValue(['0x123456789abcdef'])
      }))
    },
    utils: {
      parseEther: jest.fn().mockImplementation((value) => ({ _hex: '0x64' })),
      formatEther: jest.fn().mockImplementation(() => '0.1')
    },
    constants: {
      HashZero: '0x0000000000000000000000000000000000000000000000000000000000000000'
    },
    Contract: jest.fn()
  }
}));

// Mock toast
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn()
  }
}));

// Mock Connection from @solana/web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(1000000000),
    getRecentBlockhash: jest.fn().mockResolvedValue({ blockhash: 'mockhash' }),
    confirmTransaction: jest.fn().mockResolvedValue(true),
    sendRawTransaction: jest.fn().mockResolvedValue('solana-tx-signature')
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: jest.fn().mockReturnValue(key)
  })),
  SystemProgram: {
    transfer: jest.fn().mockReturnValue({})
  },
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    recentBlockhash: '',
    feePayer: null,
    serialize: jest.fn().mockReturnValue(new Uint8Array())
  }))
}));

// Mock blockchainService
jest.mock('../services/blockchainService', () => ({
  blockchainService: {
    checkWalletStatus: jest.fn().mockResolvedValue(true),
    transferTokens: jest.fn().mockResolvedValue(true)
  }
}));

// Create a test component that uses the hook
function TestComponent() {
  const wallet = useWallet();
  return (
    <div>
      <div data-testid="ethereum-address">{wallet.walletAddress.ethereum || 'not connected'}</div>
      <div data-testid="solana-address">{wallet.walletAddress.solana || 'not connected'}</div>
      <div data-testid="is-connecting">{wallet.isConnecting ? 'connecting' : 'not connecting'}</div>
      <div data-testid="is-ethereum-connected">{wallet.isConnected('ethereum') ? 'connected' : 'not connected'}</div>
      <div data-testid="is-solana-connected">{wallet.isConnected('solana') ? 'connected' : 'not connected'}</div>
      <div data-testid="is-cross-chain-ready">{wallet.isCrossChainReady ? 'ready' : 'not ready'}</div>
      <button 
        data-testid="connect-ethereum" 
        onClick={() => wallet.connectWallet('ethereum')}
      >
        Connect Ethereum
      </button>
      <button 
        data-testid="connect-solana" 
        onClick={() => wallet.connectWallet('solana')}
      >
        Connect Solana
      </button>
      <button 
        data-testid="disconnect-ethereum" 
        onClick={() => wallet.disconnectWallet('ethereum')}
      >
        Disconnect Ethereum
      </button>
      <button 
        data-testid="disconnect-solana" 
        onClick={() => wallet.disconnectWallet('solana')}
      >
        Disconnect Solana
      </button>
    </div>
  );
}

// Wrapper component for the hook
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>{children}</UserProvider>
);

describe('useWallet hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with disconnected wallets', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByTestId('ethereum-address')).toHaveTextContent('not connected');
    expect(screen.getByTestId('solana-address')).toHaveTextContent('not connected');
    expect(screen.getByTestId('is-connecting')).toHaveTextContent('not connecting');
    expect(screen.getByTestId('is-ethereum-connected')).toHaveTextContent('not connected');
    expect(screen.getByTestId('is-solana-connected')).toHaveTextContent('not connected');
    expect(screen.getByTestId('is-cross-chain-ready')).toHaveTextContent('not ready');
  });

  test('should connect to Ethereum wallet', async () => {
    global.window.ethereum.request.mockResolvedValueOnce(['0x123456789abcdef']);
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await act(async () => {
      screen.getByTestId('connect-ethereum').click();
    });

    expect(screen.getByTestId('ethereum-address')).toHaveTextContent('0x123456789abcdef');
    expect(screen.getByTestId('is-ethereum-connected')).toHaveTextContent('connected');
  });

  test('should connect to Solana wallet', async () => {
    const mockPublicKey = { toString: () => 'solana12345' };
    global.window.solana.connect.mockResolvedValueOnce({ publicKey: mockPublicKey });
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await act(async () => {
      screen.getByTestId('connect-solana').click();
    });

    expect(screen.getByTestId('solana-address')).toHaveTextContent('solana12345');
    expect(screen.getByTestId('is-solana-connected')).toHaveTextContent('connected');
  });

  test('should set cross-chain ready when both wallets are connected', async () => {
    global.window.ethereum.request.mockResolvedValueOnce(['0x123456789abcdef']);
    const mockPublicKey = { toString: () => 'solana12345' };
    global.window.solana.connect.mockResolvedValueOnce({ publicKey: mockPublicKey });
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Connect Ethereum
    await act(async () => {
      screen.getByTestId('connect-ethereum').click();
    });

    // Connect Solana
    await act(async () => {
      screen.getByTestId('connect-solana').click();
    });

    expect(screen.getByTestId('is-cross-chain-ready')).toHaveTextContent('ready');
  });

  test('should disconnect Ethereum wallet', async () => {
    global.window.ethereum.request.mockResolvedValueOnce(['0x123456789abcdef']);
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // First connect
    await act(async () => {
      screen.getByTestId('connect-ethereum').click();
    });

    // Then disconnect
    await act(async () => {
      screen.getByTestId('disconnect-ethereum').click();
    });

    expect(screen.getByTestId('ethereum-address')).toHaveTextContent('not connected');
    expect(screen.getByTestId('is-ethereum-connected')).toHaveTextContent('not connected');
  });

  test('should disconnect Solana wallet', async () => {
    const mockPublicKey = { toString: () => 'solana12345' };
    global.window.solana.connect.mockResolvedValueOnce({ publicKey: mockPublicKey });
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // First connect
    await act(async () => {
      screen.getByTestId('connect-solana').click();
    });

    // Then disconnect
    await act(async () => {
      screen.getByTestId('disconnect-solana').click();
    });

    expect(screen.getByTestId('solana-address')).toHaveTextContent('not connected');
    expect(screen.getByTestId('is-solana-connected')).toHaveTextContent('not connected');
  });
}); 
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.ethereum and window.solana
Object.defineProperty(window, 'ethereum', {
  value: {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn()
  },
  writable: true
});

Object.defineProperty(window, 'solana', {
  value: {
    isPhantom: true,
    isConnected: false,
    publicKey: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn()
  },
  writable: true
});

// Set up process.env
process.env.REACT_APP_ETH_TOURNAMENT_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
process.env.REACT_APP_ETH_VALIDATOR_CONTRACT_ADDRESS = '0x2345678901234567890123456789012345678901';
process.env.REACT_APP_SOLANA_TOURNAMENT_PROGRAM_ID = 'Tournament1111111111111111111111111111111111';
process.env.REACT_APP_SOLANA_VALIDATOR_PROGRAM_ID = 'Validator1111111111111111111111111111111111';
process.env.REACT_APP_SOLANA_RPC_URL = 'https://api.devnet.solana.com';

// Mock ResizeObserver which isn't available in test environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Suppress console errors and warnings during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Ignore specific expected errors
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
    args[0]?.includes?.('Warning: An update to') ||
    args[0]?.includes?.('Warning: Can\'t perform a React state update')
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Ignore specific expected warnings
  if (
    args[0]?.includes?.('Warning: findDOMNode is deprecated')
  ) {
    return;
  }
  originalConsoleWarn(...args);
}; 
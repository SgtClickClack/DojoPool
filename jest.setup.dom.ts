// Polyfill TextEncoder/TextDecoder for Node.js test environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Setup for jsdom environment (UI tests)
import '@testing-library/jest-dom';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// Polyfills needed for jsdom environment 
// Removed TextEncoder/TextDecoder as they might conflict/be redundant
import 'whatwg-fetch'; // Polyfill for fetch
import structuredClone from '@ungap/structured-clone';
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = structuredClone;
}

// Mock Firebase Initialization (needed for UI tests using Firebase hooks/context)
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(() => ({ 
        options: { apiKey: 'mock-key' }, 
        name: 'mock-app',
    })),
    getApps: jest.fn(() => []),
    getApp: jest.fn(() => ({ 
        options: { apiKey: 'mock-key' },
        name: 'mock-app',
    })),
    _getProvider: jest.fn().mockReturnValue({ 
        getImmediate: jest.fn((options?: { optional: boolean }) => { 
            if (options?.optional) return null; 
            return {
                getFunctions: jest.fn(() => ({
                     app: { options: { apiKey: 'mock-key' } },
                     INTERNAL: { deleted: false },
                })),
            };
        })
    }),
}));
jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => ({ /* mock functions instance */ })),
}));
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({ settings: {} })),
    onAuthStateChanged: jest.fn(() => jest.fn()), 
    sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
    updateProfile: jest.fn(() => Promise.resolve()),
    GoogleAuthProvider: jest.fn(),
    FacebookAuthProvider: jest.fn(),
    TwitterAuthProvider: jest.fn(),
    GithubAuthProvider: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({})})), 
    enableIndexedDbPersistence: jest.fn(() => Promise.resolve()),
    initializeFirestore: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(() => ({})),
    ref: jest.fn(),
    uploadBytes: jest.fn(() => Promise.resolve({})), 
    getDownloadURL: jest.fn(() => Promise.resolve('mock-url')),
}));

// Mock ResizeObserver (needed for components using libraries like recharts)
// Source: https://github.com/maslianok/react-resize-detector/issues/145#issuecomment-847300519
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Configure Testing Library (optional)
import { configure } from '@testing-library/react';
configure({
  // asyncUtilTimeout: 2000, 
});

// DO NOT setup MSW server here - that's for the node environment setup 
import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';

// Add jest compatibility for existing tests
global.jest = vi;

// Mock Firebase Initialization
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({
    options: { apiKey: process.env.FIREBASE_API_KEY || 'test-mock-key' },
    name: 'mock-app',
  })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({
    options: { apiKey: process.env.FIREBASE_API_KEY || 'test-mock-key' },
    name: 'mock-app',
  })),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({
    /* mock functions instance */
  })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ settings: {} })),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  updateProfile: vi.fn(() => Promise.resolve()),
  GoogleAuthProvider: vi.fn(),
  FacebookAuthProvider: vi.fn(),
  TwitterAuthProvider: vi.fn(),
  GithubAuthProvider: vi.fn(),
  OAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() =>
    Promise.resolve({ exists: () => false, data: () => ({}) })
  ),
  enableIndexedDbPersistence: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(() => Promise.resolve({})),
  getDownloadURL: vi.fn(() => Promise.resolve('mock-url')),
}));

// Setup MSW for Vitest
import { server } from '../__tests__/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

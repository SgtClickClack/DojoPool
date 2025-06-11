// Mock Firebase Auth
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  setPersistence: jest.fn(),
};

const mockGoogleAuthProvider = {
  setCustomParameters: jest.fn(),
};

// Mock Firebase exports
jest.mock('../firebase/firebase', () => ({
  auth: mockAuth,
  db: null,
  storage: null,
  analytics: null,
  currentApp: null,
  onAuthStateChanged: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  GoogleAuthProvider: jest.fn(() => mockGoogleAuthProvider),
  googleAuthProvider: mockGoogleAuthProvider,
  signInWithPopup: jest.fn(),
  __esModule: true,
  default: null,
})); 
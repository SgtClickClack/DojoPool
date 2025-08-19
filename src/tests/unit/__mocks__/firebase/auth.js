// Mock Firebase Auth
const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  getIdToken: jest.fn(() => Promise.resolve('test-token')),
};

const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: jest.fn((callback) => {
    callback(mockUser);
    return () => {};
  }),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: mockUser })
  ),
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: mockUser })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  confirmPasswordReset: jest.fn(() => Promise.resolve()),
  updatePassword: jest.fn(() => Promise.resolve()),
  updateEmail: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  setPersistence: jest.fn(() => Promise.resolve()),
};

const mockGoogleAuthProvider = {
  setCustomParameters: jest.fn(),
  addScope: jest.fn(),
};

const mockGithubAuthProvider = {
  setCustomParameters: jest.fn(),
  addScope: jest.fn(),
};

const mockTwitterAuthProvider = {
  setCustomParameters: jest.fn(),
};

const mockFacebookAuthProvider = {
  setCustomParameters: jest.fn(),
  addScope: jest.fn(),
};

module.exports = {
  getAuth: jest.fn(() => mockAuth),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: mockUser })
  ),
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: mockUser })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  confirmPasswordReset: jest.fn(() => Promise.resolve()),
  updatePassword: jest.fn(() => Promise.resolve()),
  updateEmail: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  setPersistence: jest.fn(() => Promise.resolve()),
  GoogleAuthProvider: jest.fn(() => mockGoogleAuthProvider),
  GithubAuthProvider: jest.fn(() => mockGithubAuthProvider),
  TwitterAuthProvider: jest.fn(() => mockTwitterAuthProvider),
  FacebookAuthProvider: jest.fn(() => mockFacebookAuthProvider),
  signInWithPopup: jest.fn(() => Promise.resolve({ user: mockUser })),
  signInWithRedirect: jest.fn(() => Promise.resolve()),
  getRedirectResult: jest.fn(() => Promise.resolve({ user: mockUser })),
  onAuthStateChanged: jest.fn((callback) => {
    callback(mockUser);
    return () => {};
  }),
  connectAuthEmulator: jest.fn(),
  browserLocalPersistence: 'LOCAL',
  browserSessionPersistence: 'SESSION',
  inMemoryPersistence: 'NONE',
};

// Mock Firebase App
const mockApp = {
  name: '[DEFAULT]',
  options: {
    apiKey: 'test-api-key',
    authDomain: 'test-project.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
    measurementId: 'G-ABCDEF',
  },
  delete: jest.fn(() => Promise.resolve()),
};

module.exports = {
  initializeApp: jest.fn(() => mockApp),
  getApp: jest.fn(() => mockApp),
  getApps: jest.fn(() => [mockApp]),
  deleteApp: jest.fn(() => Promise.resolve()),
  registerVersion: jest.fn(),
  _DEFAULT_ENTRY_NAME: '[DEFAULT]',
};

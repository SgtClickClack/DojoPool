// Mock Firebase Analytics
const mockAnalytics = {
  logEvent: jest.fn(),
  setCurrentScreen: jest.fn(),
  setUserId: jest.fn(),
  setUserProperties: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn(),
};

module.exports = {
  getAnalytics: jest.fn(() => mockAnalytics),
  logEvent: jest.fn(),
  setCurrentScreen: jest.fn(),
  setUserId: jest.fn(),
  setUserProperties: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn(),
  connectAnalyticsEmulator: jest.fn(),
};

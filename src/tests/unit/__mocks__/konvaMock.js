// Mock Konva components and utilities
const mockKonva = {
  Stage: jest.fn(({ children }) => children),
  Layer: jest.fn(({ children }) => children),
  Group: jest.fn(({ children }) => children),
  Rect: jest.fn(() => null),
  Circle: jest.fn(() => null),
  Line: jest.fn(() => null),
  Text: jest.fn(() => null),
  Image: jest.fn(() => null),
  Transformer: jest.fn(() => null),
  useImage: jest.fn(() => [null, null]),
  useStrictMode: jest.fn(),
  _useStrictMode: false,
};

module.exports = mockKonva;

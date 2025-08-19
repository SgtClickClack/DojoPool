// Mock Firebase Storage
const mockRef = {
  put: jest.fn(() => Promise.resolve({ ref: mockRef })),
  putString: jest.fn(() => Promise.resolve({ ref: mockRef })),
  getDownloadURL: jest.fn(() =>
    Promise.resolve('https://example.com/test-file')
  ),
  delete: jest.fn(() => Promise.resolve()),
  getMetadata: jest.fn(() =>
    Promise.resolve({ name: 'test-file', size: 1024 })
  ),
  updateMetadata: jest.fn(() =>
    Promise.resolve({ name: 'test-file', size: 1024 })
  ),
  listAll: jest.fn(() => Promise.resolve({ items: [], prefixes: [] })),
  child: jest.fn(() => mockRef),
};

const mockStorage = {
  ref: jest.fn(() => mockRef),
  refFromURL: jest.fn(() => mockRef),
  uploadBytes: jest.fn(() => Promise.resolve({ ref: mockRef })),
  uploadString: jest.fn(() => Promise.resolve({ ref: mockRef })),
  getDownloadURL: jest.fn(() =>
    Promise.resolve('https://example.com/test-file')
  ),
  deleteObject: jest.fn(() => Promise.resolve()),
  getMetadata: jest.fn(() =>
    Promise.resolve({ name: 'test-file', size: 1024 })
  ),
  updateMetadata: jest.fn(() =>
    Promise.resolve({ name: 'test-file', size: 1024 })
  ),
  listAll: jest.fn(() => Promise.resolve({ items: [], prefixes: [] })),
};

module.exports = {
  getStorage: jest.fn(() => mockStorage),
  ref: jest.fn(() => mockRef),
  refFromURL: jest.fn(() => mockRef),
  uploadBytes: jest.fn(() => Promise.resolve({ ref: mockRef })),
  uploadString: jest.fn(() => Promise.resolve({ ref: mockRef })),
  getDownloadURL: jest.fn(() =>
    Promise.resolve('https://example.com/test-file')
  ),
  deleteObject: jest.fn(() => Promise.resolve()),
  getMetadata: jest.fn(() =>
    Promise.resolve({ name: 'test-file', size: 1024 })
  ),
  updateMetadata: jest.fn(() =>
    Promise.resolve({ name: 'test-file', size: 1024 })
  ),
  listAll: jest.fn(() => Promise.resolve({ items: [], prefixes: [] })),
  connectStorageEmulator: jest.fn(),
};

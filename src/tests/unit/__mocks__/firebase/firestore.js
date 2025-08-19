// Mock Firebase Firestore
const mockCollection = {
  doc: jest.fn(() => mockDoc),
  add: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })),
  get: jest.fn(() => Promise.resolve({ docs: [] })),
  where: jest.fn(() => mockCollection),
  orderBy: jest.fn(() => mockCollection),
  limit: jest.fn(() => mockCollection),
  startAfter: jest.fn(() => mockCollection),
  endBefore: jest.fn(() => mockCollection),
  onSnapshot: jest.fn((callback) => {
    callback({ docs: [] });
    return () => {};
  }),
};

const mockDoc = {
  get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  onSnapshot: jest.fn((callback) => {
    callback({ exists: true, data: () => ({}) });
    return () => {};
  }),
  collection: jest.fn(() => mockCollection),
};

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(() => Promise.resolve()),
};

const mockTransaction = {
  get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockQuery = {
  where: jest.fn(() => mockQuery),
  orderBy: jest.fn(() => mockQuery),
  limit: jest.fn(() => mockQuery),
  startAfter: jest.fn(() => mockQuery),
  endBefore: jest.fn(() => mockQuery),
  get: jest.fn(() => Promise.resolve({ docs: [] })),
  onSnapshot: jest.fn((callback) => {
    callback({ docs: [] });
    return () => {};
  }),
};

const mockFirestore = {
  collection: jest.fn(() => mockCollection),
  doc: jest.fn(() => mockDoc),
  batch: jest.fn(() => mockBatch),
  runTransaction: jest.fn((callback) => callback(mockTransaction)),
  settings: jest.fn(),
  enableNetwork: jest.fn(() => Promise.resolve()),
  disableNetwork: jest.fn(() => Promise.resolve()),
  clearPersistence: jest.fn(() => Promise.resolve()),
  waitForPendingWrites: jest.fn(() => Promise.resolve()),
  terminate: jest.fn(() => Promise.resolve()),
};

module.exports = {
  getFirestore: jest.fn(() => mockFirestore),
  collection: jest.fn(() => mockCollection),
  doc: jest.fn(() => mockDoc),
  getDoc: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })),
  query: jest.fn(() => mockQuery),
  where: jest.fn(() => mockQuery),
  orderBy: jest.fn(() => mockQuery),
  limit: jest.fn(() => mockQuery),
  startAfter: jest.fn(() => mockQuery),
  endBefore: jest.fn(() => mockQuery),
  serverTimestamp: jest.fn(() => ({ _seconds: 0, _nanoseconds: 0 })),
  Timestamp: {
    fromDate: jest.fn((date) => ({
      _seconds: Math.floor(date.getTime() / 1000),
      _nanoseconds: 0,
    })),
    fromMillis: jest.fn((millis) => ({
      _seconds: Math.floor(millis / 1000),
      _nanoseconds: 0,
    })),
    now: jest.fn(() => ({
      _seconds: Math.floor(Date.now() / 1000),
      _nanoseconds: 0,
    })),
  },
  FieldValue: {
    serverTimestamp: jest.fn(() => ({ _seconds: 0, _nanoseconds: 0 })),
    increment: jest.fn((n) => ({ _increment: n })),
    arrayUnion: jest.fn((...elements) => ({ _arrayUnion: elements })),
    arrayRemove: jest.fn((...elements) => ({ _arrayRemove: elements })),
    delete: jest.fn(() => ({ _delete: true })),
  },
  connectFirestoreEmulator: jest.fn(),
};

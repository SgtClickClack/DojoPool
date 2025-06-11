// Import all Firebase component mocks
const auth = require('./auth');
const firestore = require('./firestore');
const storage = require('./storage');
const analytics = require('./analytics');
const app = require('./app');

// Export all Firebase components
module.exports = {
  auth,
  firestore,
  storage,
  analytics,
  app,
  // Add any other Firebase services as needed
}; 
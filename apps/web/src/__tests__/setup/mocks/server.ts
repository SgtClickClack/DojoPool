/**
 * MSW Server Setup
 * 
 * Mock Service Worker server configuration for API mocking
 * in tests and development.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server with handlers
export const server = setupServer(...handlers);

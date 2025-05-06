// src/__tests__/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers'; // Assuming handlers are defined here

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers); 
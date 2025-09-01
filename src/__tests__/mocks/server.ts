import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock handlers for API endpoints
const handlers = [
  // Auth endpoints
  rest.post('http://localhost:3002/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
        },
      })
    );
  }),

  rest.post('http://localhost:3002/api/v1/auth/google', (req, res, ctx) => {
    return res(
      ctx.json({
        url: 'https://accounts.google.com/oauth/authorize?mock=oauth',
      })
    );
  }),

  // User endpoints
  rest.get('http://localhost:3002/api/v1/users/me', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        profile: {
          displayName: 'Test User',
          skillRating: 1500,
        },
      })
    );
  }),

  // Tournament endpoints
  rest.get('http://localhost:3002/api/v1/tournaments', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          name: 'Test Tournament',
          status: 'ACTIVE',
          participants: [],
          maxParticipants: 16,
        },
      ])
    );
  }),

  // Venue endpoints
  rest.get('http://localhost:3002/api/v1/venues', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          name: 'Test Venue',
          lat: 40.7128,
          lng: -74.006,
          tables: 4,
        },
      ])
    );
  }),

  // Clan endpoints
  rest.get('http://localhost:3002/api/v1/clans', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          name: 'Test Clan',
          description: 'A test clan',
          leaderId: '1',
          treasury: 1000,
        },
      ])
    );
  }),

  // Marketplace endpoints
  rest.get(
    'http://localhost:3002/api/v1/marketplace/items',
    (req, res, ctx) => {
      return res(
        ctx.json([
          {
            id: '1',
            name: 'Test Item',
            price: 100,
            type: 'AVATAR',
          },
        ])
      );
    }
  ),
];

export const server = setupServer(...handlers);

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock handlers for API endpoints
const handlers = [
  // Auth endpoints
  http.post('http://localhost:3002/api/v1/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      },
    });
  }),

  http.post('http://localhost:3002/api/v1/auth/google', () => {
    return HttpResponse.json({
      url: 'https://accounts.google.com/oauth/authorize?mock=oauth',
    });
  }),

  // User endpoints
  http.get('http://localhost:3002/api/v1/users/me', () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      profile: {
        displayName: 'Test User',
        skillRating: 1500,
      },
    });
  }),

  // Tournament endpoints
  http.get('http://localhost:3002/api/v1/tournaments', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Test Tournament',
        status: 'ACTIVE',
        participants: [],
        maxParticipants: 16,
      },
    ]);
  }),

  // Venue endpoints
  http.get('http://localhost:3002/api/v1/venues', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Test Venue',
        lat: 40.7128,
        lng: -74.006,
        tables: 4,
      },
    ]);
  }),

  // Clan endpoints
  http.get('http://localhost:3002/api/v1/clans', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Test Clan',
        description: 'A test clan',
        leaderId: '1',
        treasury: 1000,
      },
    ]);
  }),

  // Marketplace endpoints
  http.get('http://localhost:3002/api/v1/marketplace/items', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Test Item',
        price: 100,
        type: 'AVATAR',
      },
    ]);
  }),
];

export const server = setupServer(...handlers);

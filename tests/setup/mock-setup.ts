import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock API handlers
const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'mock-jwt-token'
      }
    });
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: { id: '1', username: 'newuser', email: 'new@example.com' },
        token: 'mock-jwt-token'
      }
    });
  }),

  // User endpoints
  http.get('/api/users', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', username: 'user1', email: 'user1@example.com' },
        { id: '2', username: 'user2', email: 'user2@example.com' }
      ]
    });
  }),

  // Venue endpoints
  http.get('/api/venues', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', name: 'Venue 1', address: '123 Main St' },
        { id: '2', name: 'Venue 2', address: '456 Oak Ave' }
      ]
    });
  }),

  // Match endpoints
  http.get('/api/matches', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', playerA: 'user1', playerB: 'user2', status: 'active' },
        { id: '2', playerA: 'user3', playerB: 'user4', status: 'completed' }
      ]
    });
  })
];

export const server = setupServer(...handlers);

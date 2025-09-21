import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock API endpoints for testing
  http.get('/api/v1/users', () => {
    return HttpResponse.json([
      { id: '1', username: 'testuser1', email: 'test1@example.com' },
      { id: '2', username: 'testuser2', email: 'test2@example.com' },
    ]);
  }),

  http.get('/api/v1/venues', () => {
    return HttpResponse.json([
      { id: '1', name: 'Test Venue 1', status: 'ACTIVE' },
      { id: '2', name: 'Test Venue 2', status: 'ACTIVE' },
    ]);
  }),

  http.get('/api/v1/matches', () => {
    return HttpResponse.json([
      { id: '1', playerAId: '1', playerBId: '2', status: 'ACTIVE' },
    ]);
  }),

  // Mock authentication endpoints
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
    });
  }),

  http.post('/api/v1/auth/register', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: { id: '1', username: 'newuser', email: 'new@example.com' },
    });
  }),

  // Mock error responses for testing error handling
  http.get('/api/v1/error', () => {
    return HttpResponse.json(
      { error: 'Test error' },
      { status: 500 }
    );
  }),
];

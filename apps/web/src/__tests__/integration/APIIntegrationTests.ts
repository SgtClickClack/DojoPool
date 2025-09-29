/**
 * API Integration Tests
 * 
 * Comprehensive integration tests for API endpoints,
 * authentication flows, and data persistence.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { server } from '../setup/mocks/server';
import { http, HttpResponse } from 'msw';
import { createMockUser, createMockDojo, createMockClan } from '../setup/testSetup';

// Mock fetch for testing
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('API Integration Tests', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
    jest.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Authentication API', () => {
    it('should handle successful login', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it('should handle failed login', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle user registration', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
          username: 'newuser',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user.email).toBe('newuser@example.com');
      expect(data.user.username).toBe('newuser');
    });

    it('should handle user profile retrieval', async () => {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token',
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.email).toBeDefined();
    });
  });

  describe('Dojo API', () => {
    it('should fetch dojos list', async () => {
      const response = await fetch('/api/v1/dojos');
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.dojos).toBeDefined();
      expect(Array.isArray(data.dojos)).toBe(true);
    });

    it('should fetch specific dojo', async () => {
      const response = await fetch('/api/v1/dojos/dojo-1');
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.id).toBe('dojo-1');
      expect(data.name).toBeDefined();
    });

    it('should handle dojo not found', async () => {
      const response = await fetch('/api/v1/dojos/nonexistent');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('Clan API', () => {
    it('should fetch clans list', async () => {
      const response = await fetch('/api/v1/clans');
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.clans).toBeDefined();
      expect(Array.isArray(data.clans)).toBe(true);
    });

    it('should create new clan', async () => {
      const response = await fetch('/api/v1/clans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Clan',
          tag: 'NEW',
          description: 'A new test clan',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.name).toBe('New Clan');
      expect(data.tag).toBe('NEW');
    });
  });

  describe('Match API', () => {
    it('should fetch matches list', async () => {
      const response = await fetch('/api/v1/matches');
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.matches).toBeDefined();
      expect(Array.isArray(data.matches)).toBe(true);
    });

    it('should create new match', async () => {
      const response = await fetch('/api/v1/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerAId: 'user-1',
          playerBId: 'user-2',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.playerAId).toBe('user-1');
      expect(data.playerBId).toBe('user-2');
    });
  });

  describe('Notification API', () => {
    it('should fetch notifications', async () => {
      const response = await fetch('/api/v1/notifications');
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.notifications).toBeDefined();
      expect(data.unreadCount).toBeDefined();
      expect(data.totalCount).toBeDefined();
    });

    it('should mark notification as read', async () => {
      const response = await fetch('/api/v1/notifications/notification-1/read', {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Venue API', () => {
    it('should fetch venues list', async () => {
      const response = await fetch('/api/v1/venues');
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.venues).toBeDefined();
      expect(Array.isArray(data.venues)).toBe(true);
    });
  });

  describe('Dashboard API', () => {
    it('should fetch dashboard stats', async () => {
      const response = await fetch('/api/v1/dashboard/stats');
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.totalUsers).toBeDefined();
      expect(data.totalDojos).toBeDefined();
      expect(data.totalClans).toBeDefined();
      expect(data.totalMatches).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Mock network error
      server.use(
        http.get('/api/v1/dojos', () => {
          return HttpResponse.error();
        })
      );

      const response = await fetch('/api/v1/dojos');
      expect(response.ok).toBe(false);
    });

    it('should handle server errors', async () => {
      // Mock server error
      server.use(
        http.get('/api/v1/dojos', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      const response = await fetch('/api/v1/dojos');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle timeout errors', async () => {
      // Mock timeout
      server.use(
        http.get('/api/v1/dojos', () => {
          return new Promise(() => {}); // Never resolves
        })
      );

      // Set a timeout for the test
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 1000);
      });

      const fetchPromise = fetch('/api/v1/dojos');
      
      await expect(Promise.race([fetchPromise, timeoutPromise])).rejects.toThrow('Timeout');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit exceeded', async () => {
      // Mock rate limit response
      server.use(
        http.get('/api/v1/dojos', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': '1640995200',
                'Retry-After': '60',
              },
            }
          );
        })
      );

      const response = await fetch('/api/v1/dojos');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Data Validation', () => {
    it('should validate request data', async () => {
      const response = await fetch('/api/v1/clans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should sanitize input data', async () => {
      const response = await fetch('/api/v1/clans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '<script>alert("xss")</script>',
          tag: 'TEST',
          description: 'A test clan',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      // Ensure XSS is prevented
      expect(data.name).not.toContain('<script>');
    });
  });

  describe('Performance Testing', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = performance.now();
      
      const response = await fetch('/api/v1/dojos');
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(1000); // 1 second threshold
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () => 
        fetch('/api/v1/dojos')
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });

  describe('Security Testing', () => {
    it('should require authentication for protected endpoints', async () => {
      const response = await fetch('/api/users/me');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should validate CSRF tokens', async () => {
      const response = await fetch('/api/v1/clans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'invalid-token',
        },
        body: JSON.stringify({
          name: 'Test Clan',
          tag: 'TEST',
          description: 'A test clan',
        }),
      });

      // Should fail CSRF validation
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });

    it('should prevent SQL injection', async () => {
      const response = await fetch('/api/v1/dojos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: "'; DROP TABLE users; --",
          description: 'Malicious input',
        }),
      });

      // Should sanitize input and not execute SQL
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });
});

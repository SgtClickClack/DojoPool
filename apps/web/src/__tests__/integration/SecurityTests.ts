/**
 * Security Integration Tests
 * 
 * Comprehensive security testing suite covering authentication, authorization,
 * input validation, and security headers.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { server } from '../setup/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Security Integration Tests', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Authentication Security', () => {
    it('should require authentication for protected endpoints', async () => {
      const response = await fetch('/api/users/me');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should validate JWT tokens properly', async () => {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle expired tokens gracefully', async () => {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': 'Bearer expired-token',
        },
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should prevent SQL injection in user input', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await fetch('/api/v1/dojos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: maliciousInput,
          description: 'Malicious input',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should prevent XSS attacks in user input', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await fetch('/api/v1/dojos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Dojo',
          description: xssPayload,
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should validate email format in registration', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'validpassword123',
          username: 'testuser',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should enforce password strength requirements', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: '123', // Too short
          username: 'testuser',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('CSRF Protection', () => {
    it('should require CSRF tokens for state-changing requests', async () => {
      const response = await fetch('/api/v1/clans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Clan',
          tag: 'TEST',
          description: 'A test clan',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });

    it('should validate CSRF tokens properly', async () => {
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

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      const requests = Array(10).fill(null).map(() =>
        fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await fetch('/api/health');
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    });

    it('should include Content Security Policy header', async () => {
      const response = await fetch('/api/health');
      const csp = response.headers.get('Content-Security-Policy');
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
    });
  });

  describe('Authorization', () => {
    it('should prevent unauthorized access to admin endpoints', async () => {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': 'Bearer user-token',
        },
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });

    it('should allow authorized access to admin endpoints', async () => {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      });
      
      expect(response.ok).toBe(true);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize user input before storage', async () => {
      const response = await fetch('/api/v1/dojos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          name: 'Test Dojo<script>alert("xss")</script>',
          description: 'A test dojo with <b>HTML</b> content',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        expect(data.name).not.toContain('<script>');
        expect(data.description).not.toContain('<b>');
      }
    });
  });

  describe('Session Security', () => {
    it('should invalidate sessions on logout', async () => {
      // First, login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
        }),
      });

      expect(loginResponse.ok).toBe(true);
      const { token } = await loginResponse.json();

      // Then logout
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(logoutResponse.ok).toBe(true);

      // Try to use the token after logout
      const protectedResponse = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(protectedResponse.ok).toBe(false);
      expect(protectedResponse.status).toBe(401);
    });
  });

  describe('File Upload Security', () => {
    it('should validate file types for uploads', async () => {
      const formData = new FormData();
      const maliciousFile = new File(['malicious content'], 'malicious.exe', {
        type: 'application/x-executable',
      });
      formData.append('file', maliciousFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should limit file size for uploads', async () => {
      const formData = new FormData();
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      formData.append('file', largeFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(413);
    });
  });
});

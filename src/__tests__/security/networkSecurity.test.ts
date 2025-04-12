import { createServer } from 'https';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Request, Response } from 'express';
import helmet from 'helmet';

describe('Network Security Tests', () => {
  let server: any;
  const sslOptions = {
    key: readFileSync(join(__dirname, '../../certs/private.key')),
    cert: readFileSync(join(__dirname, '../../certs/certificate.crt'))
  };

  beforeEach(() => {
    server = createServer(sslOptions, (req: Request, res: Response) => {
      // Apply security headers
      helmet()(req, res, () => {});
      res.end('Test response');
    });
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe('SSL/TLS Configuration', () => {
    it('should enforce HTTPS', async () => {
      const response = await fetch('http://localhost:3000', {
        redirect: 'manual'
      });
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toMatch(/^https:\/\//);
    });

    it('should use strong cipher suites', async () => {
      const response = await fetch('https://localhost:3000');
      const cipher = response.headers.get('x-ssl-cipher');
      expect(cipher).toMatch(/TLS_AES_256_GCM_SHA384|TLS_CHACHA20_POLY1305_SHA256/);
    });

    it('should use TLS 1.2 or higher', async () => {
      const response = await fetch('https://localhost:3000');
      const protocol = response.headers.get('x-ssl-protocol');
      expect(protocol).toMatch(/TLSv1\.2|TLSv1\.3/);
    });
  });

  describe('Security Headers', () => {
    it('should include Content-Security-Policy header', async () => {
      const response = await fetch('https://localhost:3000');
      const csp = response.headers.get('content-security-policy');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    });

    it('should include X-Content-Type-Options header', async () => {
      const response = await fetch('https://localhost:3000');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await fetch('https://localhost:3000');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await fetch('https://localhost:3000');
      expect(response.headers.get('x-xss-protection')).toBe('1; mode=block');
    });

    it('should include Strict-Transport-Security header', async () => {
      const response = await fetch('https://localhost:3000');
      const hsts = response.headers.get('strict-transport-security');
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    it('should include Referrer-Policy header', async () => {
      const response = await fetch('https://localhost:3000');
      expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should include Permissions-Policy header', async () => {
      const response = await fetch('https://localhost:3000');
      const permissions = response.headers.get('permissions-policy');
      expect(permissions).toContain('camera=()');
      expect(permissions).toContain('microphone=()');
      expect(permissions).toContain('geolocation=()');
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from trusted origins', async () => {
      const response = await fetch('https://localhost:3000', {
        headers: {
          'Origin': 'https://trusted-domain.com'
        }
      });
      expect(response.headers.get('access-control-allow-origin')).toBe('https://trusted-domain.com');
    });

    it('should reject requests from untrusted origins', async () => {
      const response = await fetch('https://localhost:3000', {
        headers: {
          'Origin': 'https://untrusted-domain.com'
        }
      });
      expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });
  });
}); 
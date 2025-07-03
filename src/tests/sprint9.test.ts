import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Import services to test
import { ServiceWorkerManager, registerServiceWorker } from '../utils/serviceWorker';
import { AnalyticsService, trackEvent, trackPageView } from '../services/AnalyticsService';
import { SecurityService, sanitizeInput, validateInput } from '../services/SecurityService';
import { BundleOptimizer, analyzeBundle } from '../utils/bundleOptimizer';
import { DeploymentManager, getDeploymentConfig } from '../config/deployment';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock service worker
Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  },
  writable: true
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    getEntriesByType: vi.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000
    }
  },
  writable: true
});

// Mock crypto API
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn(() => new Uint8Array(32))
  },
  writable: true
});

// Test utilities
const mockFetch = vi.fn();
const mockServiceWorker = {
  register: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

describe('SPRINT 9: Advanced Features & Production Deployment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Worker Tests', () => {
    it('should register service worker successfully', async () => {
      const mockRegistration = {
        active: { state: 'activated' },
        installing: null,
        waiting: null,
        addEventListener: vi.fn(),
        update: vi.fn(),
        unregister: vi.fn()
      };

      (navigator.serviceWorker.register as any).mockResolvedValue(mockRegistration);

      const result = await registerServiceWorker();
      
      expect(result).toBe(mockRegistration);
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    });

    it('should handle service worker registration failure', async () => {
      const error = new Error('Registration failed');
      (navigator.serviceWorker.register as any).mockRejectedValue(error);

      const onError = vi.fn();
      await registerServiceWorker({ onError });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should handle service worker not supported', async () => {
      const originalServiceWorker = navigator.serviceWorker;
      delete (navigator as any).serviceWorker;

      const onError = vi.fn();
      await registerServiceWorker({ onError });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('Service Worker not supported');

      (navigator as any).serviceWorker = originalServiceWorker;
    });
  });

  describe('Analytics Service Tests', () => {
    it('should track events correctly', () => {
      const analytics = AnalyticsService.getInstance();
      
      trackEvent('test', 'action', 'label', 100, { test: 'data' });
      
      const sessionData = analytics.getSessionData();
      expect(sessionData?.events).toHaveLength(1);
      expect(sessionData?.events[0]).toMatchObject({
        category: 'test',
        action: 'action',
        label: 'label',
        value: 100,
        properties: { test: 'data' }
      });
    });

    it('should track page views', () => {
      const analytics = AnalyticsService.getInstance();
      
      trackPageView('/test-page', { referrer: '/home' });
      
      const sessionData = analytics.getSessionData();
      expect(sessionData?.pageViews).toBe(1);
      expect(sessionData?.events).toHaveLength(1);
      expect(sessionData?.events[0].category).toBe('navigation');
    });

    it('should track errors', () => {
      const analytics = AnalyticsService.getInstance();
      const error = new Error('Test error');
      
      analytics.trackError(error, { context: 'test' });
      
      const sessionData = analytics.getSessionData();
      expect(sessionData?.events).toHaveLength(1);
      expect(sessionData?.events[0].category).toBe('error');
      expect(sessionData?.events[0].action).toBe('javascript_error');
    });

    it('should track API calls', () => {
      const analytics = AnalyticsService.getInstance();
      
      analytics.trackApiCall('/api/test', 'GET', 150, 200);
      
      const sessionData = analytics.getSessionData();
      expect(sessionData?.events).toHaveLength(1);
      expect(sessionData?.events[0].category).toBe('api');
      expect(sessionData?.events[0].action).toBe('request');
    });

    it('should flush data when online', async () => {
      const analytics = AnalyticsService.getInstance();
      
      // Mock successful fetch
      (fetch as any).mockResolvedValue({ ok: true });
      
      trackEvent('test', 'action');
      await analytics.flush();
      
      expect(fetch).toHaveBeenCalledWith('/api/analytics/track', expect.any(Object));
    });
  });

  describe('Security Service Tests', () => {
    it('should sanitize XSS input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello World');
    });

    it('should validate input correctly', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };

      const rules = [
        { field: 'name', type: 'string' as const, required: true, minLength: 2 },
        { field: 'email', type: 'email' as const, required: true },
        { field: 'age', type: 'number' as const, required: true }
      ];

      const result = validateInput(data, rules);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid input', () => {
      const data = {
        name: 'J',
        email: 'invalid-email',
        age: 'not-a-number'
      };

      const rules = [
        { field: 'name', type: 'string' as const, required: true, minLength: 2 },
        { field: 'email', type: 'email' as const, required: true },
        { field: 'age', type: 'number' as const, required: true }
      ];

      const result = validateInput(data, rules);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate and validate CSRF tokens', () => {
      const security = SecurityService.getInstance();
      const userId = 'user123';
      
      const token = security.generateCSRFToken(userId);
      expect(token).toBeTruthy();
      
      const isValid = security.validateCSRFToken(userId, token);
      expect(isValid).toBe(true);
      
      const isInvalid = security.validateCSRFToken(userId, 'invalid-token');
      expect(isInvalid).toBe(false);
    });

    it('should handle rate limiting', () => {
      const security = SecurityService.getInstance();
      const identifier = 'test-user';
      
      // First 10 requests should be allowed
      for (let i = 0; i < 10; i++) {
        expect(security.checkRateLimit(identifier, 10, 60000)).toBe(true);
      }
      
      // 11th request should be blocked
      expect(security.checkRateLimit(identifier, 10, 60000)).toBe(false);
    });
  });

  describe('Bundle Optimizer Tests', () => {
    it('should analyze bundle correctly', async () => {
      const analysis = await analyzeBundle();
      
      expect(analysis).toHaveProperty('totalSize');
      expect(analysis).toHaveProperty('gzippedSize');
      expect(analysis).toHaveProperty('modules');
      expect(analysis).toHaveProperty('chunks');
      expect(analysis).toHaveProperty('suggestions');
    });

    it('should generate optimization suggestions', async () => {
      const analysis = await analyzeBundle();
      
      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(analysis.suggestions[0]).toHaveProperty('type');
      expect(analysis.suggestions[0]).toHaveProperty('priority');
      expect(analysis.suggestions[0]).toHaveProperty('description');
      expect(analysis.suggestions[0]).toHaveProperty('potentialSavings');
    });

    it('should generate optimization report', async () => {
      await analyzeBundle();
      const report = BundleOptimizer.getInstance().generateReport();
      
      expect(report).toContain('Bundle Optimization Report');
      expect(report).toContain('Summary');
      expect(report).toContain('Largest Modules');
      expect(report).toContain('Optimization Suggestions');
    });

    it('should track bundle metrics', async () => {
      // Mock successful fetch
      (fetch as any).mockResolvedValue({ ok: true });
      
      await BundleOptimizer.getInstance().trackBundleSize();
      
      expect(fetch).toHaveBeenCalledWith('/api/analytics/bundle-metrics', expect.any(Object));
    });
  });

  describe('Deployment Manager Tests', () => {
    it('should load correct configuration for development', () => {
      const config = getDeploymentConfig();
      
      expect(config.environment).toBe('development');
      expect(config.apiUrl).toBe('http://localhost:8080');
      expect(config.analyticsEnabled).toBe(false);
      expect(config.serviceWorkerEnabled).toBe(false);
    });

    it('should validate configuration correctly', () => {
      const deploymentManager = DeploymentManager.getInstance();
      const validation = deploymentManager.validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should generate environment variables', () => {
      const deploymentManager = DeploymentManager.getInstance();
      const envVars = deploymentManager.generateEnvVars();
      
      expect(envVars).toHaveProperty('NODE_ENV');
      expect(envVars).toHaveProperty('REACT_APP_API_URL');
      expect(envVars).toHaveProperty('REACT_APP_ANALYTICS_ENABLED');
    });

    it('should check feature flags correctly', () => {
      const deploymentManager = DeploymentManager.getInstance();
      
      expect(deploymentManager.isFeatureEnabled('securityEnabled')).toBe(true);
      expect(deploymentManager.isFeatureEnabled('analyticsEnabled')).toBe(false);
    });

    it('should generate build configuration', () => {
      const deploymentManager = DeploymentManager.getInstance();
      const buildConfig = deploymentManager.generateBuildConfig();
      
      expect(buildConfig).toHaveProperty('outputDir');
      expect(buildConfig).toHaveProperty('publicPath');
      expect(buildConfig).toHaveProperty('sourceMap');
      expect(buildConfig).toHaveProperty('minify');
    });
  });

  describe('Integration Tests', () => {
    it('should initialize all services together', async () => {
      const deploymentManager = DeploymentManager.getInstance();
      
      // Enable all features for testing
      deploymentManager.updateConfig({
        analyticsEnabled: true,
        serviceWorkerEnabled: true,
        securityEnabled: true,
        monitoringEnabled: true
      });

      // Mock service worker registration
      const mockRegistration = {
        active: { state: 'activated' },
        installing: null,
        waiting: null,
        addEventListener: vi.fn(),
        update: vi.fn(),
        unregister: vi.fn()
      };
      (navigator.serviceWorker.register as any).mockResolvedValue(mockRegistration);

      // Mock successful API calls
      (fetch as any).mockResolvedValue({ ok: true });

      // Initialize services
      const analytics = AnalyticsService.getInstance();
      const security = SecurityService.getInstance();
      const bundleOptimizer = BundleOptimizer.getInstance();

      // Test service integration
      trackEvent('integration', 'test');
      const sanitized = sanitizeInput('<script>test</script>');
      const analysis = await analyzeBundle();

      expect(analytics.getEventCount()).toBeGreaterThan(0);
      expect(sanitized).not.toContain('<script>');
      expect(analysis).toBeTruthy();
    });

    it('should handle service failures gracefully', async () => {
      // Mock service worker failure
      (navigator.serviceWorker.register as any).mockRejectedValue(new Error('SW failed'));

      // Mock API failure
      (fetch as any).mockRejectedValue(new Error('API failed'));

      const analytics = AnalyticsService.getInstance();
      const security = SecurityService.getInstance();

      // Services should still work even with failures
      trackEvent('test', 'action');
      const sanitized = sanitizeInput('test');

      expect(analytics.getEventCount()).toBeGreaterThan(0);
      expect(sanitized).toBe('test');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large numbers of events efficiently', () => {
      const analytics = AnalyticsService.getInstance();
      const startTime = performance.now();

      // Track 1000 events
      for (let i = 0; i < 1000; i++) {
        trackEvent('performance', 'test', `event-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(analytics.getEventCount()).toBe(1000);
    });

    it('should handle large input sanitization efficiently', () => {
      const security = SecurityService.getInstance();
      const largeInput = '<script>alert("xss")</script>'.repeat(1000);
      const startTime = performance.now();

      const sanitized = sanitizeInput(largeInput);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(sanitized).not.toContain('<script>');
    });
  });
}); 
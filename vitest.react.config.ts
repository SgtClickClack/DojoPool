import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [
      './tests/setupTests.ts',
      './tests/setup/test-config.ts'
    ],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
    ],
    include: [
      'tests/integration/**/*.{test,spec}.{jsx,tsx}',
      'apps/web/**/*.{test,spec}.{jsx,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/mocks/**',
        '**/fixtures/**',
        '**/utils/**',
        '**/setup/**',
      ],
      include: [
        'apps/web/src/**/*.{ts,tsx}',
        '!apps/web/src/**/*.test.{ts,tsx}',
        '!apps/web/src/**/*.spec.{ts,tsx}',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': 'apps/web/src',
      '@tests': 'tests',
      '@mocks': 'tests/mocks',
      '@fixtures': 'tests/fixtures',
      '@utils': 'tests/utils',
    },
  },
});

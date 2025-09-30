import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'apps/web/tests/setup.ts')],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'tests/integration/**',
    ],
    include: [
      'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'apps/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'services/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'infrastructure/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '!**/node_modules/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
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
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
      include: [
        'services/api/src/**/*.ts',
        'apps/web/src/**/*.ts',
        '!services/api/src/**/*.spec.ts',
        '!services/api/src/**/*.test.ts',
        '!apps/web/src/**/*.test.ts',
        '!apps/web/src/**/*.spec.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
      '@tests': path.resolve(__dirname, 'tests'),
      '@mocks': path.resolve(__dirname, 'tests/mocks'),
      '@fixtures': path.resolve(__dirname, 'tests/fixtures'),
      '@utils': path.resolve(__dirname, 'tests/utils'),
    },
  },
});

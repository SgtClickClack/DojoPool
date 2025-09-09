import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./jest.setup.ts'],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'apps/web/**',
      'services/api/src/**/*.e2e.spec.ts',
      'services/api/src/**/*.integration.spec.ts',
    ],
    include: [
      'services/api/src/cache/cache.helper.spec.ts',
      'services/api/src/insights/**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        'apps/web/**',
        'services/api/src/main.ts',
        'services/api/src/**/*.module.ts',
        'packages/**/dist/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'services/api/src'),
    },
  },
});

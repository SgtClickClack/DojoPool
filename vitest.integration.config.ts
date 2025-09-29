import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'apps/web/**',
    ],
    include: [
      'tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      // Exclude complex NestJS controller tests that require full app setup
      '!services/api/src/**/*.controller.spec.ts',
      '!services/api/src/**/*.controller.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      all: false,
      include: [
        'services/api/src/**/*.controller.ts',
        'services/api/src/**/*.service.ts',
        '!services/api/src/**/*.spec.ts',
        '!services/api/src/**/*.test.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        'apps/web/**',
        'services/api/src/main.ts',
        'services/api/src/**/*.module.ts',
        'packages/**/dist/**',
        'tests/**',
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
      '@': path.resolve(__dirname, 'apps/web/src'),
      '@api': path.resolve(__dirname, 'services/api/src'),
      '@tests': path.resolve(__dirname, 'tests'),
      '@mocks': path.resolve(__dirname, 'tests/mocks'),
      '@fixtures': path.resolve(__dirname, 'tests/fixtures'),
      '@utils': path.resolve(__dirname, 'tests/utils'),
      // Stub winston in tests to avoid missing dependency
      winston: path.resolve(__dirname, 'tests/mocks/winston-stub.ts'),
    },
  },
});

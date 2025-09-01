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
    ],
    include: [
      'services/api/src/**/*.integration.spec.ts',
      'services/api/src/**/*.integration.test.ts',
      'services/api/src/__tests__/territories.e2e.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      all: false,
      include: [
        'services/api/src/**/*.integration.spec.ts',
        'services/api/src/__tests__/territories.e2e.spec.ts',
      ],
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
      // Stub winston in tests to avoid missing dependency
      winston: path.resolve(__dirname, 'tests/mocks/winston-stub.ts'),
    },
  },
});

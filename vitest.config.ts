import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./apps/web/tests/setup.ts'],
    globals: true,
    include: [
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'apps/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'services/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'infrastructure/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts'],
      thresholds: {
        global: { branches: 70, functions: 70, lines: 70, statements: 70 },
      },
    },
    testTimeout: 10000,
    retry: 2,
  },
  resolve: {
    alias: {
      // App aliases
      '@': resolve(__dirname, './apps/web/src'),
      '@/hooks': resolve(__dirname, './apps/web/src/hooks'),
      '@/utils': resolve(__dirname, './apps/web/src/utils'),
      '@/components': resolve(__dirname, './apps/web/src/components'),
      '@tests': resolve(__dirname, './tests'),
      // Shared UI package
      '@components': resolve(__dirname, './packages/ui/src/components'),
    },
  },
  esbuild: {
    // Ensure JSX has React in scope for tests
    jsxInject: "import React from 'react'",
  },
});

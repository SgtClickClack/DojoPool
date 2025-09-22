import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/test-setup.ts'],
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'tests/components/ui-components.test.tsx',
      'tests/unit/ui-components.test.tsx',
      'tests/components/simple-ui.test.tsx',
      'tests/components/isolated-ui.test.tsx',
      'tests/integration/integration.test.tsx',
      'tests/integration/Home.test.tsx',
      'tests/hooks/api-hooks.test.ts',
      'tests/unit/working-ui-test.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts'],
      thresholds: {
        global: { branches: 85, functions: 85, lines: 85, statements: 85 },
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

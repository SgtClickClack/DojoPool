import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // No setup files for components - keep them isolated
    globals: false, // Disable globals to avoid auto-cleanup conflicts
    include: [
      'tests/components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
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
      include: ['packages/ui/src/**/*.ts', 'apps/web/src/components/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
      '@components': path.resolve(__dirname, './packages/ui/src/components'),
    },
  },
  esbuild: {
    jsxInject: "import React from 'react'",
  },
});

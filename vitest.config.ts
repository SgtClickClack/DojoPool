import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'src/tests/integration/**',
      // Exclude problematic third-party tests
      '**/tsconfig-paths/**',
      '**/@react-google-maps/**',
      '**/__tests__/utils/injectscript.test.ts',
      '**/__tests__/components/circle.test.tsx',
      '**/__tests__/filesystem.test.ts',
      '**/__tests__/match-path-async.test.ts',
      '**/__tests__/mapping-entry.test.ts',
    ],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '!src/**/node_modules/**',
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});

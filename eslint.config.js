// eslint.config.js (Flat Config)
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/generated/**',
      '**/*.min.*',
      'venv/**',
      'apps/**',
      'packages/**',
      'DojoPool*/**',
      'Dojo_Pool*/**',
      'Dojo Pool*/**',
      'combined/**',
      'generated/**',
      'blueprints/**',
      'blockchain/**',
      'infrastructure/**',
      'k8s/**',
      'monitoring/**',
      'narrative/**',
      'ranking/**',
      'spectator/**',
      'static/**',
      'templates/**',
      'tests/**',
      'lcov-report/**',
      'cypress/**',
    ],
  },

  js.configs.recommended,

  // TypeScript rules and language options (using @typescript-eslint parser + plugin)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.es2021,
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...(tsPlugin.configs.recommended.rules ?? {}),
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'smart'],
      curly: ['error', 'all'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
    },
  },

  // React + React Hooks (for .jsx/.tsx)
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-no-target-blank': ['warn', { allowReferrer: true }],
      'react/prop-types': 'off',
    },
  },

  // Test files: enable Jest globals
  {
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      'tests/**/*.{ts,tsx,js,jsx}',
      'src/tests/**/*.{ts,tsx,js,jsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },

  // Declaration files: relax certain rules
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-undef': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Disable formatting concerns in ESLint; handled by Prettier
  prettier,
];

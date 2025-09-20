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
      // Migrated from .eslintignore
      'node_modules/',
      'venv/',
      'dist/',
      'build/',
      // Existing broader repo ignores
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/generated/**',
      '**/*.min.*',
      'venv/**',

      // Legacy directories that are no longer part of the core project
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
      'lcov-report/**',
      'cypress/**',
      // Frontend test and Cypress bundles not part of lint scope for CI coverage gating
      'apps/web/__tests__/**',
      'apps/web/cypress/**',
      'apps/web/public/**',
      'apps/web/postcss.config.js',
      'apps/web/next.config.js',
      'apps/web/middleware.ts',

      // Test files are now properly configured
      'src/tests/**',
      'src/**/__tests__/**',
      'apps/web/src/tests/**',
      'apps/web/src/**/__tests__/**',
      'services/api/src/tests/**',
      'services/api/src/**/__tests__/**',
      'services/api/src/**/*.spec.ts',
      'services/api/src/**/*.test.ts',
      'services/api/test-*.js',
      'services/api/types/**',
      'jest.setup.ts',
    ],
  },

  js.configs.recommended,

  // TypeScript rules and language options (using @typescript-eslint parser + plugin)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json', './apps/web/tsconfig.json', './services/api/tsconfig.json'],
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
      'no-debugger': 'warn',
      eqeqeq: ['warn', 'smart'],
      curly: ['warn', 'all'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/no-misused-promises': [
        'warn',
        { checksVoidReturn: { attributes: false } },
      ],
      // Enforce consistent import aliasing
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../**', '../../**', '../../../**', '../../../../**'],
              message:
                'Use @/* import alias instead of relative paths for better maintainability',
            },
          ],
        },
      ],
      'no-empty': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-useless-catch': 'warn',
      'no-undef': 'off',
    },
  },

  // Backend test files: relax TS project service to avoid parse errors
  {
    files: [
      'services/api/src/**/*.spec.ts',
      'services/api/src/**/*.test.ts',
      'services/api/src/**/__tests__/**/*.ts',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-undef': 'off',
    },
  },

  // Backend sources: temporarily disable restricted import alias rule
  {
    files: ['services/api/src/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // Declaration files: ensure no project service requirement
  {
    files: ['**/*.d.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Gateways: relax async rules for event-handling style
  {
    files: ['services/api/src/**/*.gateway.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
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
        project: ['./tsconfig.json', './apps/web/tsconfig.json', './services/api/tsconfig.json'],
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
    rules: {
      // Allow require in test setup contexts
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Declaration files: relax certain rules
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-undef': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },

  // Disable formatting concerns in ESLint; handled by Prettier
  prettier,
];

import pkg from '@eslint/js';
const { configs } = pkg;
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import securityPlugin from 'eslint-plugin-security';
import nodePlugin from 'eslint-plugin-node';
import globals from 'globals';
import { fixupPluginRules } from '@eslint/compat';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        browser: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'security': securityPlugin,
      'node': fixupPluginRules(nodePlugin),
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-object-injection': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-unsafe-regex': 'error',
      'node/no-deprecated-api': 'error',
      'node/no-extraneous-import': 'error',
      'node/no-missing-import': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'node/no-deprecated-api': 'off',
      'node/no-extraneous-import': 'off',
      'node/no-missing-import': 'off',
    },
  },
]; 
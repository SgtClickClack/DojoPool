module.exports = [
  {
    // Ignore files from these directories
    ignores: ['**/node_modules/**', '**/venv/**', '**/dist/**', '**/build/**'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly'
      }
    },
    rules: {
      // Warn when console statements occur in your own code.
      'no-console': 'warn',
      // Disable rules that are not found.
      'react-internal/no-production-logging': 'off',
      'react-internal/prod-error-codes': 'off'
    }
  }
]; 
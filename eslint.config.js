module.exports = [
  {
    // Only apply this configuration to your application source files.
    // Adjust these globs if your source code lives elsewhere (e.g. "src/**/*.{js,jsx,ts,tsx}").
    files: ["pages/**/*.{js,jsx,ts,tsx}", "components/**/*.{js,jsx,ts,tsx}"],
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
      'react-internal/prod-error-codes': 'off',
      'react-internal/safe-string-coercion': 'off'
    }
  }
]; 
module.exports = [
  {
    // Specify patterns to ignore files/folders from linting (using ESLint flat config "ignores").
    ignores: ['**/node_modules/**', '**/venv/**', '**/dist/**', '**/build/**'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      },
      globals: {
        window: "readonly",
        document: "readonly",
        process: "readonly",
        __dirname: "readonly",
        module: "readonly"
      }
    },
    rules: {
      "no-console": "warn"
      // Add additional rules as needed.
    }
  }
]; 
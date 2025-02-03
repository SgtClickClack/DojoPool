const recommended = require("eslint/conf/eslint-recommended");

module.exports = [
  // Include the recommended ESLint config first.
  recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      },
      // Define global variables that were previously provided by the "env" key.
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        // Node.js globals
        process: "readonly",
        __dirname: "readonly",
        module: "readonly"
      }
    },
    rules: {
      // Add your custom rules or overrides here.
      // For example: "no-console": "warn",
    },
  },
]; 
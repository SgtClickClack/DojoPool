module.exports = [
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      },
      // Manually define globals that were previously provided by the "env" key.
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
    extends: ["eslint:recommended"],
    rules: {
      // Define or override any custom rules here:
      // For example, to warn on console usage:
      // "no-console": "warn"
    },
  },
]; 
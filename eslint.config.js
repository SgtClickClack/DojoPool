module.exports = [
  {
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
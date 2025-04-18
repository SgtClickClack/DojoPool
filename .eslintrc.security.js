const securityPlugin = require("eslint-plugin-security");

module.exports = {
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    globals: {
      node: true,
    },
  },
  plugins: {
    security: securityPlugin,
  },
  rules: {
    // Security-specific rules
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "error",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-new-buffer": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-fs-filename": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-non-literal-require": "error",
    "security/detect-object-injection": "error",
    "security/detect-possible-timing-attacks": "error",
    "security/detect-pseudoRandomBytes": "error",
    "security/detect-unsafe-regex": "error",

    // General security rules
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-script-url": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-optional-chaining": "error",
  },
};

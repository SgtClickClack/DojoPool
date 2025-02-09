module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:security/recommended',
    'plugin:xss/recommended',
    'plugin:no-unsanitized/DOM',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'security',
    'xss',
    'no-unsanitized',
    'no-secrets',
    'anti-trojan-source',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Security Rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'no-secrets/no-secrets': [
      'error',
      {
        ignoreContent: ['^test', '^dev'],
        additionalRegexes: {
          'Custom Pattern': 'secret|password|token|key',
        },
      },
    ],
    'anti-trojan-source/no-bidi': 'error',

    // XSS Prevention
    'xss/no-mixed-html': 'error',
    'xss/no-location-href-assign': 'error',
    'no-unsanitized/method': 'error',
    'no-unsanitized/property': 'error',

    // React Security
    'react/no-danger': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-invalid-html-attribute': 'error',
    'react/no-render-return-value': 'error',
    'react/no-unescaped-entities': 'error',

    // TypeScript Security
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/restrict-template-expressions': 'error',
    '@typescript-eslint/no-floating-promises': 'error',

    // Best Practices
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-process-env': 'error',
    'no-process-exit': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    'require-await': 'error',

    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Accessibility
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      rules: {
        'no-secrets/no-secrets': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'security/detect-non-literal-regexp': 'off',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
      },
    },
  ],
}; 
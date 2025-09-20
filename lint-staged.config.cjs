module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix --ignore-pattern "eslint.config.js"',
    'prettier --write',
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
};

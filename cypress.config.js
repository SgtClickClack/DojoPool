const { defineConfig } = require('cypress');
const failFast = require('cypress-fail-fast/plugin');

let percyHealthCheck = null;
try {
  percyHealthCheck = require('@percy/cypress/task');
} catch (error) {
  console.log('Percy not configured or unavailable:', error.message);
}

module.exports = defineConfig({
  projectId: 'yd2zoy',
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 120000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      apiUrl: 'http://localhost:3002/api/v1',
      coverage: true,
    },
    setupNodeEvents(on, config) {
      try {
        require('@cypress/code-coverage/task')(on, config);
      } catch (error) {
        console.log('Code coverage not configured:', error.message);
      }

      failFast(on, config);

      if (percyHealthCheck) {
        on('task', percyHealthCheck);
      }

      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });

      return config;
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      try {
        require('@cypress/code-coverage/task')(on, config);
      } catch (error) {
        console.log('Code coverage not configured:', error.message);
      }
      return config;
    },
  },
});

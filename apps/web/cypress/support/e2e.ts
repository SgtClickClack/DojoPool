import '@testing-library/cypress/add-commands';

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.findByLabelText('Email').type(email);
  cy.findByLabelText('Password').type(password);
  cy.findByRole('button', { name: 'Sign In' }).click();
});

// Custom command to create a game
Cypress.Commands.add('createGame', (player1: string, player2: string) => {
  cy.visit('/games/create');
  cy.findByLabelText('Player 1').type(player1);
  cy.findByLabelText('Player 2').type(player2);
  cy.findByRole('button', { name: 'Create Game' }).click();
});

// Custom command to load fixtures
Cypress.Commands.add('loadFixtures', () => {
  return cy.fixture('test-data').then((data) => {
    return data;
  });
});

// Global configuration for better test reliability
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that are not critical for testing
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection')) {
    return false;
  }
  return true;
});

// Configure viewport for consistent testing
beforeEach(() => {
  cy.viewport(1280, 720);
});

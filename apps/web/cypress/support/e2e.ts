import '@testing-library/cypress/add-commands';

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="login-email-input"]').type(email);
  cy.get('[data-testid="login-password-input"]').type(password);
  cy.findByRole('button', { name: 'Sign In' }).click();
  // Wait for redirect to dashboard or handle login response
  cy.url().should('not.include', '/login');
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.findByText(/testuser|admin/i).click();
  cy.findByText(/Logout/i).click();
  cy.url().should('include', '/login');
});

// Custom command to check if user is authenticated
Cypress.Commands.add('isAuthenticated', () => {
  cy.get('body').should('not.contain', 'Sign In');
  cy.get('body').should('contain', 'testuser');
});

// Custom command to check if user is not authenticated
Cypress.Commands.add('isNotAuthenticated', () => {
  cy.get('body').should('contain', 'Sign In');
  cy.get('body').should('not.contain', 'testuser');
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

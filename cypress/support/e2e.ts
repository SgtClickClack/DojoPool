import '@percy/cypress';
import '@testing-library/cypress/add-commands';
import './commands';

// Custom command to login
Cypress.Commands.add(
  'login',
  (email: string = 'player1@example.com', password: string = 'password123') => {
    cy.visit('/login');
    // Wait for the page to load and form to be visible
    cy.get('form').should('be.visible');
    cy.get('[data-testid="login-email-input"]')
      .should('be.visible')
      .type(email);
    cy.get('[data-testid="login-password-input"]')
      .should('be.visible')
      .type(password);
    cy.findByRole('button', { name: 'Sign In' }).click();
  }
);

// Custom command to create a game
Cypress.Commands.add('createGame', (player1Id: string, player2Id: string) => {
  cy.visit('/games/new');
  cy.findByLabelText('Player 1').type(player1Id);
  cy.findByLabelText('Player 2').type(player2Id);
  cy.findByRole('button', { name: 'Create Game' }).click();
});

// Custom command to check game state
Cypress.Commands.add('checkGameState', (gameId: string) => {
  cy.visit(`/games/${gameId}`);
  cy.findByTestId('game-state').should('exist');
});

// Extend Cypress types
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createGame(player1Id: string, player2Id: string): Chainable<void>;
      checkGameState(gameId: string): Chainable<void>;
      waitForAnimations(): Chainable<void>;
      tab(): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      compareSnapshot(name: string): Chainable<void>;
    }
  }
}

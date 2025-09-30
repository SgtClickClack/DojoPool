// Code coverage support (optional)
// import 'cypress-fail-fast'; // Disabled for batch remediation

try {
  require('@cypress/code-coverage/support');
} catch (error) {
  console.log('Code coverage support not available');
}

try {
  require('@percy/cypress');
  require('@percy/cypress/task');
} catch (error) {
  console.log('Percy support not available');
}

import '@testing-library/cypress/add-commands';
import './commands';

// Global test configuration
beforeEach(() => {
  // Set up default viewport
  cy.viewport(1280, 720);
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions from the app
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection')) {
    return false;
  }
  return true;
});

// Custom command to create a game
Cypress.Commands.add('createGame', (player1Id: string, player2Id: string) => {
  cy.visit('/games/new');
  cy.get('[data-testid="opponent-select"]').click();
  cy.get('[role="option"]').first().click();
  cy.get('[data-testid="create-game-submit"]').click();
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
      createGame(player1Id: string, player2Id: string): Chainable<void>;
      checkGameState(gameId: string): Chainable<void>;
      waitForAnimations(): Chainable<void>;
      tab(): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      compareSnapshot(name: string): Chainable<void>;
    }
  }
}

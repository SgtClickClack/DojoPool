import '@testing-library/cypress/add-commands';
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand();

// Custom command for visual testing
Cypress.Commands.add('compareSnapshot', (name: string) => {
  cy.matchImageSnapshot(name, {
    failureThreshold: 0.03, // 3% threshold
    failureThresholdType: 'percent',
  });
});

// Custom command for waiting for animations
Cypress.Commands.add('waitForAnimations', () => {
  cy.get('body').should('not.have.class', 'animating');
  cy.wait(500); // Additional buffer for any CSS transitions
});

declare global {
  namespace Cypress {
    interface Chainable {
      compareSnapshot(name: string): Chainable<void>;
      waitForAnimations(): Chainable<void>;
    }
  }
} 
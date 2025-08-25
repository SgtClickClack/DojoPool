import '@testing-library/cypress/add-commands';
// Visual snapshot commands are stubbed out to avoid legacy peer conflicts
// Remove stubs and re-enable cypress-image-snapshot when upgraded
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};
// @ts-ignore - cypress types may not include this when plugin is absent
Cypress.Commands.add('matchImageSnapshot', noop as any);
Cypress.Commands.add('compareSnapshot', (name: string) => {
  noop();
});

// Custom command for waiting for animations
Cypress.Commands.add('waitForAnimations', () => {
  cy.wait(1000); // Simple wait for animations to complete
});

// Custom command for tab navigation
Cypress.Commands.add('tab', () => {
  cy.focused().tab();
});

// Custom command for waiting for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.wait(500); // Buffer for any remaining animations
});

declare global {
  namespace Cypress {
    interface Chainable {
      compareSnapshot(name: string): Chainable<void>;
      waitForAnimations(): Chainable<void>;
      tab(): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
    }
  }
}

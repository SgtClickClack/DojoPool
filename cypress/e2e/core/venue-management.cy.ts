describe('Venue Management', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
  });

  it('displays venue list', () => {
    cy.visit('/venue-management');
    cy.waitForAnimations();

    cy.get('[data-testid="venue-list"]').should('be.visible');
    cy.get('[data-testid="venue-card"]').should('have.length', 1);
    cy.compareSnapshot('venue-list-default');
  });

  it('can add new venue', () => {
    cy.visit('/venue-management');
    cy.waitForAnimations();

    cy.get('[data-testid="add-venue-button"]').click();
    cy.waitForAnimations();
    cy.compareSnapshot('add-venue-form');

    cy.get('[data-testid="venue-name-input"]').should('be.visible');
    cy.get('[data-testid="venue-name-input"]').type('New Venue');
    cy.get('[data-testid="venue-address-input"]').type('456 New St');
    cy.get('[data-testid="venue-tables-input"]').type('6');

    cy.compareSnapshot('filled-venue-form');
    cy.get('[data-testid="submit-venue-button"]').click();

    cy.waitForAnimations();
    cy.get('[data-testid="venue-card"]').should('have.length', 2);
    cy.compareSnapshot('venue-list-after-add');
  });

  it('can edit venue', () => {
    cy.visit('/venue-management');
    cy.waitForAnimations();

    cy.get('[data-testid="edit-venue-button-1"]').click();
    cy.waitForAnimations();
    cy.compareSnapshot('edit-venue-form');

    cy.get('[data-testid="venue-name-input"]').should('be.visible');
    cy.get('[data-testid="venue-name-input"]').clear().type('Updated Venue');
    cy.get('[data-testid="venue-address-input"]').clear().type('789 Update St');
    cy.get('[data-testid="venue-tables-input"]').clear().type('5');

    cy.compareSnapshot('filled-edit-form');
    cy.get('[data-testid="submit-venue-button"]').click();

    cy.waitForAnimations();
    cy.contains('Updated Venue').should('be.visible');
    cy.compareSnapshot('venue-list-after-edit');
  });

  it('can delete venue', () => {
    cy.visit('/venue-management');
    cy.waitForAnimations();

    cy.get('[data-testid="delete-venue-button-1"]').click();
    cy.waitForAnimations();
    cy.compareSnapshot('delete-confirmation-modal');

    cy.get('[data-testid="confirm-delete-button"]').click();

    cy.waitForAnimations();
    cy.get('[data-testid="venue-card"]').should('have.length', 0);
    cy.compareSnapshot('venue-list-after-delete');
  });

  it('shows error message on API failure', () => {
    cy.visit('/venue-management');
    cy.waitForAnimations();

    cy.get('[data-testid="add-venue-button"]').click();
    cy.waitForAnimations();
    cy.get('[data-testid="venue-name-input"]').should('be.visible');

    // Test validation error by submitting empty form
    cy.get('[data-testid="submit-venue-button"]').click();
    cy.waitForAnimations();
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.compareSnapshot('error-message-display');
  });
});

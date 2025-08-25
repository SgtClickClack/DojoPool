describe('Basic App Test', () => {
  it('should load the root page', () => {
    cy.visit('/');

    // Check if the page loads without errors
    cy.get('body').should('be.visible');

    // Wait a bit to see if there are any errors
    cy.wait(2000);

    // The page should still be visible
    cy.get('body').should('be.visible');
  });

  it('should load the dashboard page', () => {
    cy.visit('/dashboard');

    // Check if the page loads without errors
    cy.get('body').should('be.visible');

    // Wait a bit to see if there are any errors
    cy.wait(2000);

    // The page should still be visible
    cy.get('body').should('be.visible');
  });
});

describe('Root Page Test', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
  });

  it('should load the root page', () => {
    cy.visit('/');

    // Check if the page loads without errors
    cy.get('body').should('be.visible');

    // Wait a bit to see if there are any errors
    cy.wait(2000);

    // The page should still be visible
    cy.get('body').should('be.visible');

    // Log the page title to see what's actually loaded
    cy.title().then((title) => {
      cy.log(`Page title: ${title}`);
    });
  });
});

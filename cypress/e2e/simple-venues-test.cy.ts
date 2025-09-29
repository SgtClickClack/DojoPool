describe('Simple Venues Test', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
  });

  it('should load the test venues page', () => {
    cy.visit('/test-venues');

    // Check if the page loads without errors
    cy.get('body').should('be.visible');

    // Check if the main elements are present
    cy.contains('Test Venues Page').should('be.visible');
    cy.contains('This is a simple test page to verify routing works').should(
      'be.visible'
    );

    // Check if the status section is present
    cy.contains('Page Status').should('be.visible');
    cy.contains('✅ Page loads successfully').should('be.visible');
  });
});

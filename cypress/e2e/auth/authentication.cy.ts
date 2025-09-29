describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
  });

  it('should display the login form', () => {
    cy.get('[data-testid="login-form"]').should('be.visible');
  });
});

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
    cy.visit('/');
  });

  it('should display the login form', () => {
    cy.get('[data-testid="login-form"]').should('be.visible');
  });
});

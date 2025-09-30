describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    cy.interceptAllApis();
  });

  it('should display the login form', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-form"]').should('be.visible');
  });
});

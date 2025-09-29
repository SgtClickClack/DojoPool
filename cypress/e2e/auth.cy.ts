describe('Definitive Authentication Flow', () => {
  beforeEach(() => {
    cy.interceptAllApis();
  });

  it('should successfully log a user in programmatically and access a protected route', () => {
    // Step 1: Log in without touching the UI.
    cy.loginProgrammatically();

    // Step 2: Directly visit a protected page.
    cy.visit('/dashboard');

    // Step 3: Assert that we have successfully loaded the page.
    cy.contains('Welcome back').should('be.visible');
    cy.url().should('include', '/dashboard');
  });

  it('should handle Google OAuth redirect flow', () => {
    // Test the Google OAuth redirect without actual authentication
    cy.visit('/login');
    cy.get('[data-testid="google-signin"]').click();
    // NextAuth redirects to the signin route
    cy.url().should('include', '/api/auth/signin/google');
  });

  it('should validate login form inputs', () => {
    cy.visit('/login');

    // Test email validation
    cy.get('[data-testid="login-email-input"]').type('invalidemail');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="email-error"]').should('be.visible');

    // Test password validation
    cy.get('[data-testid="login-email-input"]')
      .clear()
      .type('test@example.com');
    cy.get('[data-testid="login-password-input"]').type('short');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="password-error"]').should('be.visible');
  });

  it('should handle invalid credentials gracefully', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-email-input"]').type('invalid@example.com');
    cy.get('[data-testid="login-password-input"]').type('wrong-password');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });
});

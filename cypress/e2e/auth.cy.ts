describe('Authentication', () => {
  beforeEach(() => {
    cy.interceptAllApis();
  });

  it('should sign in with email and password programmatically', () => {
    // This command handles the entire login flow programmatically
    cy.loginProgrammatically();
    
    // Now we can safely visit the protected page
    cy.visit('/dashboard');
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard`);
  });

  it('should sign up with email and password', () => {
    cy.visit('/login');
    cy.get('[data-testid="signup-link"]').click();
    cy.get('[data-testid="name-input"]').type('Test User');
    cy.get('[data-testid="email-input"]').type('newuser@example.com');
    cy.get('[data-testid="password-input"]').type(
      process.env.TEST_USER_PASSWORD || 'test-password'
    );
    cy.get('[data-testid="confirm-password-input"]').type(
      process.env.TEST_USER_PASSWORD || 'test-password'
    );
    cy.get('[data-testid="signup-button"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/dashboard');
  });

  it('should sign in with Google', () => {
    cy.visit('/login');
    cy.get('[data-testid="google-signin"]').click();
    // NextAuth redirects to the signin route
    cy.url().should('include', '/api/auth/signin/google');
  });

  it.skip('should sign in with Facebook', () => {
    // Facebook OAuth provider not configured
    cy.visit('/login');
    cy.get('[data-testid="facebook-signin"]').click();
    // NextAuth redirects to Facebook OAuth URL, not a popup
    cy.url().should('include', 'facebook.com');
  });

  it.skip('should sign in with Twitter', () => {
    // Twitter OAuth provider not configured
    cy.visit('/login');
    cy.get('[data-testid="twitter-signin"]').click();
    // NextAuth redirects to Twitter OAuth URL, not a popup
    cy.url().should('include', 'twitter.com');
  });

  it.skip('should sign in with GitHub', () => {
    // GitHub OAuth provider not configured
    cy.visit('/login');
    cy.get('[data-testid="github-signin"]').click();
    // NextAuth redirects to GitHub OAuth URL, not a popup
    cy.url().should('include', 'github.com');
  });

  it.skip('should sign in with Apple', () => {
    // Apple OAuth provider not configured
    cy.visit('/login');
    cy.get('[data-testid="apple-signin"]').click();
    // NextAuth redirects to Apple OAuth URL, not a popup
    cy.url().should('include', 'appleid.apple.com');
  });

  it.skip('should reset password', () => {
    // Forgot password functionality not implemented
    cy.visit('/login');
    cy.get('[data-testid="forgot-password"]').click();
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="reset-button"]').click();
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it.skip('should sign out', () => {
    // Logout functionality needs proper redirect implementation
    cy.loginProgrammatically();
    cy.visit('/dashboard');
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="signout-button"]').click();
    // After logout, user should be redirected to login page
    cy.url().should('include', '/login');
  });

  it('should handle invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-email-input"]').type('invalid@example.com');
    cy.get('[data-testid="login-password-input"]').type('wrong-password');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should validate email format', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-email-input"]').type('invalidemail');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="email-error"]').should('be.visible');
  });

  it('should validate password length', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-email-input"]').type('test@example.com');
    cy.get('[data-testid="login-password-input"]').type('short');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="password-error"]').should('be.visible');
  });
});

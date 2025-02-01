describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Login', () => {
    it('should successfully log in with valid credentials', () => {
      cy.login('test@example.com', 'password123');
      cy.url().should('include', '/dashboard');
      cy.findByText(/Welcome/i).should('exist');
    });

    it('should show error with invalid credentials', () => {
      cy.login('invalid@example.com', 'wrongpassword');
      cy.findByText(/Invalid email or password/i).should('exist');
      cy.url().should('include', '/login');
    });

    it('should validate required fields', () => {
      cy.findByRole('button', { name: /sign in/i }).click();
      cy.findByText(/Email is required/i).should('exist');
      cy.findByText(/Password is required/i).should('exist');
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    it('should successfully register a new user', () => {
      const email = `test${Date.now()}@example.com`;
      cy.findByLabelText(/email/i).type(email);
      cy.findByLabelText(/^password$/i).type('Password123!');
      cy.findByLabelText(/confirm password/i).type('Password123!');
      cy.findByRole('button', { name: /sign up/i }).click();
      cy.url().should('include', '/dashboard');
    });

    it('should show error for existing email', () => {
      cy.findByLabelText(/email/i).type('existing@example.com');
      cy.findByLabelText(/^password$/i).type('Password123!');
      cy.findByLabelText(/confirm password/i).type('Password123!');
      cy.findByRole('button', { name: /sign up/i }).click();
      cy.findByText(/Email already exists/i).should('exist');
    });

    it('should validate password requirements', () => {
      cy.findByLabelText(/email/i).type('test@example.com');
      cy.findByLabelText(/^password$/i).type('weak');
      cy.findByLabelText(/confirm password/i).type('weak');
      cy.findByRole('button', { name: /sign up/i }).click();
      cy.findByText(/Password must be at least 8 characters/i).should('exist');
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.visit('/forgot-password');
    });

    it('should send reset password email', () => {
      cy.findByLabelText(/email/i).type('test@example.com');
      cy.findByRole('button', { name: /reset password/i }).click();
      cy.findByText(/Reset link sent/i).should('exist');
    });

    it('should validate email format', () => {
      cy.findByLabelText(/email/i).type('invalid-email');
      cy.findByRole('button', { name: /reset password/i }).click();
      cy.findByText(/Invalid email format/i).should('exist');
    });
  });

  describe('Session Management', () => {
    it('should maintain session after page reload', () => {
      cy.login('test@example.com', 'password123');
      cy.reload();
      cy.url().should('include', '/dashboard');
    });

    it('should redirect to login after logout', () => {
      cy.login('test@example.com', 'password123');
      cy.findByRole('button', { name: /logout/i }).click();
      cy.url().should('include', '/login');
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });
}); 
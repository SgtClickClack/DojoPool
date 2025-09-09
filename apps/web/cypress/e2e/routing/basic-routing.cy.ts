describe('Basic Routing Test Suite', () => {
  beforeEach(() => {
    // Clear any existing sessions
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Public Routes - Basic Navigation', () => {
    it('should load home page', () => {
      cy.visit('/');
      cy.get('body').should('contain', 'DojoPool');
    });

    it('should access login page', () => {
      cy.visit('/login');
      cy.get('body').should('contain', 'Login');
    });

    it('should access registration page', () => {
      cy.visit('/auth/register');
      cy.get('body').should('contain', 'Create Account');
    });

    it('should access venues page', () => {
      cy.visit('/venues');
      cy.get('body').should('contain', 'Venues');
    });

    it('should access tournaments page', () => {
      cy.visit('/tournaments');
      cy.get('body').should('contain', 'Tournaments');
    });

    it('should access clan wars page', () => {
      cy.visit('/clan-wars');
      cy.get('body').should('contain', 'Clan Wars');
    });

    it('should access marketplace page', () => {
      cy.visit('/marketplace');
      cy.get('body').should('contain', 'Marketplace');
    });

    it('should handle 404 pages', () => {
      cy.visit('/non-existent-page');
      cy.get('body').should('contain', '404');
    });
  });

  describe('URL Structure Validation', () => {
    it('should maintain correct URLs after navigation', () => {
      cy.visit('/');
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      cy.visit('/login');
      cy.url().should('include', '/login');

      cy.visit('/venues');
      cy.url().should('include', '/venues');
    });

    it('should handle query parameters', () => {
      cy.visit('/tournaments?filter=active');
      cy.url().should('include', '/tournaments');
      cy.url().should('include', 'filter=active');
    });
  });

  describe('Page Content Validation', () => {
    it('should display appropriate content on each page', () => {
      // Home page
      cy.visit('/');
      cy.get('body').should('contain', 'Welcome to DojoPool');

      // Login page
      cy.visit('/login');
      cy.get('body').should('contain', 'Login to DojoPool');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');

      // Venues page
      cy.visit('/venues');
      cy.get('body').should('contain', 'Venues');

      // Tournaments page
      cy.visit('/tournaments');
      cy.get('body').should('contain', 'Tournaments');
    });
  });

  describe('Navigation Elements', () => {
    it('should have navigation elements on home page', () => {
      cy.visit('/');
      cy.get('button').should('contain', 'Browse Venues');
      cy.get('button').should('contain', 'Sign Up');
      cy.get('button').should('contain', 'Sign In');
    });

    it('should have proper form elements on login page', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs', () => {
      cy.visit('/%invalid%url');
      cy.get('body').should('contain', '404');
    });

    it('should handle very long URLs', () => {
      const longUrl = '/'.repeat(100);
      cy.visit(longUrl);
      cy.get('body').should('contain', '404');
    });
  });
});

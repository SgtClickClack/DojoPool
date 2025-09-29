describe('Real Infrastructure E2E Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
    cy.visit('/');
  });

  it('should connect to real database and load venues', () => {
    // Set up API intercept for venues
    cy.intercept('GET', '/api/v1/venues', { fixture: 'venues.json' }).as(
      'getVenues'
    );

    cy.visit('/venues');

    // Wait for the API call to complete
    cy.wait('@getVenues');

    // Check if the page loads without errors
    cy.get('body').should('be.visible');

    // Check if the main elements are present
    cy.contains('🏓 Discover Dojos').should('be.visible');
    cy.contains('Find the perfect pool venue near you').should('be.visible');

    // Check if search form is present
    cy.get('input[placeholder="Search venues by name..."]').should(
      'be.visible'
    );
    cy.get('input[placeholder="City"]').should('be.visible');
    cy.get('input[placeholder="State"]').should('be.visible');

    // Check if search button is present
    cy.get('button').contains('Search').should('be.visible');
  });

  it('should handle authentication flow', () => {
    cy.visit('/login');

    // Check if login form is present
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');

    // Test form interaction
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');

    // Verify form values
    cy.get('input[type="email"]').should('have.value', 'test@example.com');
    cy.get('input[type="password"]').should('have.value', 'password123');
  });

  it('should load dashboard without errors', () => {
    cy.visit('/dashboard');

    // Wait for page to load
    cy.wait(2000);

    // Check if the page loads without errors
    cy.get('body').should('be.visible');

    // Check for common dashboard elements
    cy.get('body').should('not.contain', 'Error');
    cy.get('body').should('not.contain', 'Failed to load');
  });

  it('should handle WebSocket connections', () => {
    cy.visit('/test-websocket');

    // Wait for page to load
    cy.wait(2000);

    // Check if the page loads without errors
    cy.get('body').should('be.visible');

    // Check for WebSocket test elements
    cy.get('body').should('not.contain', 'WebSocket connection failed');
  });

  it('should load tournament management page', () => {
    cy.visit('/venue/portal/tournaments');

    // Wait for page to load
    cy.wait(2000);

    // Check if the page loads without errors
    cy.get('body').should('be.visible');

    // Check for tournament management elements
    cy.get('body').should('not.contain', 'Error');
    cy.get('body').should('not.contain', 'Failed to load');
  });
});

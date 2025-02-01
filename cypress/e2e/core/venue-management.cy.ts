describe('Venue Management', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'venue_manager'
        }
      }
    }).as('login');

    // Mock venue data
    cy.intercept('GET', '/api/venues', {
      statusCode: 200,
      body: [
        {
          id: '1',
          name: 'Test Venue',
          address: '123 Test St',
          tables: 4,
          isActive: true
        }
      ]
    }).as('getVenues');

    // Visit the venues page
    cy.visit('/venues');
    cy.waitForAnimations();
  });

  it('displays venue list', () => {
    cy.wait('@getVenues');
    cy.get('[data-testid="venue-list"]').should('be.visible');
    cy.get('[data-testid="venue-card"]').should('have.length', 1);
    cy.compareSnapshot('venue-list-default');
  });

  it('can add new venue', () => {
    cy.intercept('POST', '/api/venues', {
      statusCode: 201,
      body: {
        id: '2',
        name: 'New Venue',
        address: '456 New St',
        tables: 6,
        isActive: true
      }
    }).as('addVenue');

    cy.get('[data-testid="add-venue-button"]').click();
    cy.waitForAnimations();
    cy.compareSnapshot('add-venue-form');
    
    cy.get('[data-testid="venue-form"]').should('be.visible');
    cy.get('[data-testid="venue-name-input"]').type('New Venue');
    cy.get('[data-testid="venue-address-input"]').type('456 New St');
    cy.get('[data-testid="venue-tables-input"]').type('6');
    
    cy.compareSnapshot('filled-venue-form');
    cy.get('[data-testid="submit-venue-button"]').click();

    cy.wait('@addVenue');
    cy.waitForAnimations();
    cy.get('[data-testid="venue-card"]').should('have.length', 2);
    cy.compareSnapshot('venue-list-after-add');
  });

  it('can edit venue', () => {
    cy.intercept('PUT', '/api/venues/1', {
      statusCode: 200,
      body: {
        id: '1',
        name: 'Updated Venue',
        address: '789 Update St',
        tables: 5,
        isActive: true
      }
    }).as('updateVenue');

    cy.get('[data-testid="edit-venue-button-1"]').click();
    cy.waitForAnimations();
    cy.compareSnapshot('edit-venue-form');
    
    cy.get('[data-testid="venue-form"]').should('be.visible');
    cy.get('[data-testid="venue-name-input"]').clear().type('Updated Venue');
    cy.get('[data-testid="venue-address-input"]').clear().type('789 Update St');
    cy.get('[data-testid="venue-tables-input"]').clear().type('5');
    
    cy.compareSnapshot('filled-edit-form');
    cy.get('[data-testid="submit-venue-button"]').click();

    cy.wait('@updateVenue');
    cy.waitForAnimations();
    cy.contains('Updated Venue').should('be.visible');
    cy.compareSnapshot('venue-list-after-edit');
  });

  it('can delete venue', () => {
    cy.intercept('DELETE', '/api/venues/1', {
      statusCode: 200
    }).as('deleteVenue');

    cy.get('[data-testid="delete-venue-button-1"]').click();
    cy.waitForAnimations();
    cy.compareSnapshot('delete-confirmation-modal');
    
    cy.get('[data-testid="confirm-delete-button"]').click();

    cy.wait('@deleteVenue');
    cy.waitForAnimations();
    cy.get('[data-testid="venue-card"]').should('have.length', 0);
    cy.compareSnapshot('venue-list-after-delete');
  });

  it('shows error message on API failure', () => {
    cy.intercept('POST', '/api/venues', {
      statusCode: 500,
      body: {
        error: 'Internal Server Error'
      }
    }).as('addVenueFail');

    cy.get('[data-testid="add-venue-button"]').click();
    cy.waitForAnimations();
    cy.get('[data-testid="venue-form"]').should('be.visible');
    
    cy.get('[data-testid="venue-name-input"]').type('New Venue');
    cy.get('[data-testid="submit-venue-button"]').click();

    cy.wait('@addVenueFail');
    cy.waitForAnimations();
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.compareSnapshot('error-message-display');
  });
}); 
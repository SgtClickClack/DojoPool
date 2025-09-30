describe('Venue Discovery Feature', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
    cy.visit('/');
    cy.intercept('GET', '**/v1/venues*', {
      statusCode: 200,
      body: {
        venues: [
          {
            id: 'venue_1',
            name: 'Test Dojo One',
            rating: 4.5,
            location: { address: '123 Test St' },
          },
          {
            id: 'venue_2',
            name: 'Test Dojo Two',
            rating: 4.2,
            location: { address: '456 Sample Ave' },
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      },
    }).as('getVenues');
  });
  it('should load the venues page successfully', () => {
    cy.visit('/venues');
    cy.wait('@getVenues');

    // Check if the page loads without errors
    cy.get('body').should('be.visible');

    // Check if the main elements are present
    cy.contains('🏓 Discover Dojos').should('be.visible');
    cy.contains('Find the perfect pool venue near you').should('be.visible');
  });

  it('should display search form', () => {
    cy.visit('/venues');
    cy.wait('@getVenues');

    // Check if search form is present
    cy.get('input[placeholder="Search venues by name..."]').should(
      'be.visible'
    );
    cy.get('input[placeholder="City"]').should('be.visible');
    cy.get('input[placeholder="State"]').should('be.visible');
  });

  it('should display filter checkboxes', () => {
    cy.visit('/venues');
    cy.wait('@getVenues');

    // Check if filter checkboxes are present
    cy.contains('🏆 Tournaments').should('be.visible');
    cy.contains('🍕 Food').should('be.visible');
    cy.contains('🍺 Bar').should('be.visible');
  });

  it('should display search button', () => {
    cy.visit('/venues');
    cy.wait('@getVenues');

    // Check if search button is present
    cy.get('button').contains('Search').should('be.visible');
  });

  it('should handle basic page interaction', () => {
    cy.visit('/venues');

    // Type in search field
    cy.get('input[placeholder="Search venues by name..."]').type('Test Venue');

    // Check if the input value is set
    cy.get('input[placeholder="Search venues by name..."]').should(
      'have.value',
      'Test Venue'
    );
  });
});

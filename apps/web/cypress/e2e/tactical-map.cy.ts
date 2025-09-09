describe('Tactical Map', () => {
  beforeEach(() => {
    // Set up environment variables for testing
    cy.intercept('GET', '/api/v1/territories/map', {
      fixture: 'territories.json',
    }).as('getTerritories');
    cy.intercept('POST', '/api/v1/territories/claim', { success: true }).as(
      'claimTerritory'
    );
    cy.intercept('POST', '/api/v1/territories/challenge', { success: true }).as(
      'challengeTerritory'
    );
    cy.intercept('POST', '/api/v1/territories/*/scout', { success: true }).as(
      'scoutTerritory'
    );

    // Visit the tactical map page
    cy.visit('/map');
  });

  it('should load the tactical map with territories', () => {
    // Wait for territories to load
    cy.wait('@getTerritories');

    // Check that the map container is visible
    cy.get('[data-cy="tactical-map-container"]').should('be.visible');

    // Check that territory markers are rendered
    cy.get('[data-cy="territory-marker"]').should('have.length.greaterThan', 0);
  });

  it('should display territory information on marker click', () => {
    cy.wait('@getTerritories');

    // Click on a territory marker
    cy.get('[data-cy="territory-marker"]').first().click();

    // Check that popup appears with territory details
    cy.get('[data-cy="territory-popup"]').should('be.visible');
    cy.get('[data-cy="territory-popup"]').should('contain', 'Territory');
  });

  it('should allow claiming an unclaimed territory', () => {
    cy.wait('@getTerritories');

    // Click on an unclaimed territory marker
    cy.get('[data-cy="territory-marker-unclaimed"]').first().click();

    // Check that claim button is visible and enabled
    cy.get('[data-cy="claim-territory-btn"]')
      .should('be.visible')
      .and('not.be.disabled');

    // Click claim button
    cy.get('[data-cy="claim-territory-btn"]').click();

    // Wait for claim request
    cy.wait('@claimTerritory');

    // Check that success message appears
    cy.get('[data-cy="territory-claim-success"]').should('be.visible');
  });

  it('should allow challenging a claimed territory', () => {
    cy.wait('@getTerritories');

    // Click on a claimed territory marker
    cy.get('[data-cy="territory-marker-claimed"]').first().click();

    // Check that challenge button is visible and enabled
    cy.get('[data-cy="challenge-territory-btn"]')
      .should('be.visible')
      .and('not.be.disabled');

    // Click challenge button
    cy.get('[data-cy="challenge-territory-btn"]').click();

    // Wait for challenge request
    cy.wait('@challengeTerritory');

    // Check that success message appears
    cy.get('[data-cy="territory-challenge-success"]').should('be.visible');
  });

  it('should allow scouting any territory', () => {
    cy.wait('@getTerritories');

    // Click on any territory marker
    cy.get('[data-cy="territory-marker"]').first().click();

    // Check that scout button is visible and enabled
    cy.get('[data-cy="scout-territory-btn"]')
      .should('be.visible')
      .and('not.be.disabled');

    // Click scout button
    cy.get('[data-cy="scout-territory-btn"]').click();

    // Wait for scout request
    cy.wait('@scoutTerritory');

    // Check that intelligence info appears
    cy.get('[data-cy="territory-intelligence"]').should('be.visible');
  });

  it('should show different marker colors for different territory states', () => {
    cy.wait('@getTerritories');

    // Check that unclaimed territories have green markers
    cy.get('[data-cy="territory-marker-unclaimed"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(0, 255, 157)'); // #00ff9d in rgb

    // Check that claimed territories have blue markers
    cy.get('[data-cy="territory-marker-claimed"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(0, 168, 255)'); // #00a8ff in rgb

    // Check that contested territories have orange markers
    cy.get('[data-cy="territory-marker-contested"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(255, 170, 0)'); // #ffaa00 in rgb
  });

  it('should show territory level indicators for upgraded territories', () => {
    cy.wait('@getTerritories');

    // Check that level 2+ territories show level indicators
    cy.get('[data-cy="territory-level-indicator"]').should('be.visible');
    cy.get('[data-cy="territory-level-indicator"]').should('contain', '2');
  });

  it('should handle map loading errors gracefully', () => {
    // Intercept with error response
    cy.intercept('GET', '/api/v1/territories/map', { statusCode: 500 }).as(
      'getTerritoriesError'
    );

    // Reload page to trigger error
    cy.reload();
    cy.wait('@getTerritoriesError');

    // Check that error message is displayed
    cy.get('[data-cy="map-error-message"]').should('be.visible');
    cy.get('[data-cy="map-error-message"]').should(
      'contain',
      'Failed to load territory data'
    );

    // Check that retry button is available
    cy.get('[data-cy="retry-load-map"]')
      .should('be.visible')
      .and('not.be.disabled');
  });

  it('should handle missing Mapbox token gracefully', () => {
    // Remove Mapbox token from environment
    cy.window().then((win) => {
      win.localStorage.setItem('mapbox_token_missing', 'true');
    });

    // Reload page
    cy.reload();

    // Check that configuration message is displayed
    cy.get('[data-cy="mapbox-config-message"]').should('be.visible');
    cy.get('[data-cy="mapbox-config-message"]').should(
      'contain',
      'Mapbox Token Required'
    );
  });

  it('should show territory contest information when applicable', () => {
    cy.wait('@getTerritories');

    // Click on a contested territory
    cy.get('[data-cy="territory-marker-contested"]').first().click();

    // Check that contest information is displayed
    cy.get('[data-cy="territory-contest-info"]').should('be.visible');
    cy.get('[data-cy="territory-contest-deadline"]').should('be.visible');
    cy.get('[data-cy="territory-contestant-info"]').should('be.visible');
  });

  it('should show clan information for clan-owned territories', () => {
    cy.wait('@getTerritories');

    // Click on a clan-owned territory
    cy.get('[data-cy="territory-marker-clan-owned"]').first().click();

    // Check that clan information is displayed
    cy.get('[data-cy="territory-clan-info"]').should('be.visible');
    cy.get('[data-cy="territory-clan-name"]').should('be.visible');
    cy.get('[data-cy="territory-clan-tag"]').should('be.visible');
  });

  it('should close territory popup when close button is clicked', () => {
    cy.wait('@getTerritories');

    // Click on a territory marker
    cy.get('[data-cy="territory-marker"]').first().click();

    // Check that popup is visible
    cy.get('[data-cy="territory-popup"]').should('be.visible');

    // Click close button
    cy.get('[data-cy="territory-popup-close"]').click();

    // Check that popup is closed
    cy.get('[data-cy="territory-popup"]').should('not.exist');
  });
});

describe('Territory Gameplay E2E Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
  });

  it('should display world map with territories', () => {
    cy.visit('/');

    // Mock territories data
    cy.intercept('GET', '/api/territories', {
      statusCode: 200,
      body: [
        {
          id: 'territory-1',
          name: 'Test Dojo',
          coordinates: { lat: -27.4698, lng: 153.0251 },
          owner: 'player-1',
          clan: 'test-clan',
          requiredNFT: 'trophy-1',
        },
      ],
    }).as('getTerritories');

    // Navigate to map
    cy.get('[data-testid="map-tab"]').click();
    cy.wait('@getTerritories');

    // Verify map is displayed
    cy.get('[data-testid="world-map"]').should('be.visible');

    // Verify territory is displayed
    cy.get('[data-testid="territory-marker"]').should('have.length', 1);
    cy.get('[data-testid="territory-name"]').should('contain', 'Test Dojo');
  });

  it('should allow user to challenge for territory', () => {
    cy.visit('/');

    // Mock territories and challenge creation
    cy.intercept('GET', '/api/territories', {
      statusCode: 200,
      body: [
        {
          id: 'territory-1',
          name: 'Test Dojo',
          coordinates: { lat: -27.4698, lng: 153.0251 },
          owner: 'player-2',
          clan: 'enemy-clan',
          requiredNFT: 'trophy-1',
        },
      ],
    }).as('getTerritories');

    cy.intercept('POST', '/api/challenges', {
      statusCode: 201,
      body: {
        id: 'challenge-1',
        territoryId: 'territory-1',
        challengerId: 'test-user-1',
        defenderId: 'player-2',
        status: 'pending',
      },
    }).as('createChallenge');

    // Navigate to map
    cy.get('[data-testid="map-tab"]').click();
    cy.wait('@getTerritories');

    // Click on territory to challenge
    cy.get('[data-testid="territory-marker"]').first().click();
    cy.get('[data-testid="challenge-button"]').click();

    // Confirm challenge
    cy.get('[data-testid="confirm-challenge"]').click();
    cy.wait('@createChallenge');

    // Verify challenge was created
    cy.get('[data-testid="challenge-notification"]').should(
      'contain',
      'Challenge sent'
    );
  });

  it('should allow user to accept challenge', () => {
    cy.visit('/');

    // Navigate to territory gameplay page
    cy.get('[data-testid="map-tab"]').click();

    // Mock user challenges
    cy.intercept('GET', '/api/users/test-user-1/challenges', {
      statusCode: 200,
      body: [
        {
          id: 'challenge-1',
          territoryId: 'territory-1',
          challengerId: 'player-2',
          defenderId: 'test-user-1',
          status: 'pending',
        },
      ],
    }).as('getUserChallenges');

    cy.intercept('PUT', '/api/challenges/challenge-1/accept', {
      statusCode: 200,
      body: {
        success: true,
        challenge: {
          id: 'challenge-1',
          status: 'accepted',
        },
      },
    }).as('acceptChallenge');

    // Navigate to challenges
    cy.get('[data-testid="challenges-tab"]').click();
    cy.wait('@getUserChallenges');

    // Accept challenge
    cy.get('[data-testid="accept-challenge-button"]').first().click();
    cy.wait('@acceptChallenge');

    // Verify challenge was accepted
    cy.get('[data-testid="challenge-status"]').should('contain', 'Accepted');
  });

  it('should allow user to decline challenge', () => {
    cy.visit('/');

    // Navigate to territory gameplay page
    cy.get('[data-testid="map-tab"]').click();

    // Mock user challenges
    cy.intercept('GET', '/api/users/test-user-1/challenges', {
      statusCode: 200,
      body: [
        {
          id: 'challenge-1',
          territoryId: 'territory-1',
          challengerId: 'player-2',
          defenderId: 'test-user-1',
          status: 'pending',
        },
      ],
    }).as('getUserChallenges');

    cy.intercept('PUT', '/api/challenges/challenge-1/decline', {
      statusCode: 200,
      body: {
        success: true,
        challenge: {
          id: 'challenge-1',
          status: 'declined',
        },
      },
    }).as('declineChallenge');

    // Navigate to challenges
    cy.get('[data-testid="challenges-tab"]').click();

    // Decline challenge
    cy.get('[data-testid="decline-challenge-button"]').first().click();
    cy.wait('@declineChallenge');

    // Verify challenge was declined
    cy.get('[data-testid="challenge-status"]').should('contain', 'Declined');
  });

  it('should update territory ownership after match result', () => {
    cy.visit('/');

    // Mock match result processing
    cy.intercept('POST', '/api/challenges/challenge-1/result', {
      statusCode: 200,
      body: {
        success: true,
        match_result: {
          id: 'match-1',
          winnerId: 'test-user-1',
          score: { 'test-user-1': 7, 'player-2': 3 },
        },
        territory_update: {
          id: 'territory-1',
          owner: 'test-user-1',
        },
      },
    }).as('processMatchResult');

    // Mock updated territories
    cy.intercept('GET', '/api/territories', {
      statusCode: 200,
      body: [
        {
          id: 'territory-1',
          name: 'Test Dojo',
          coordinates: { lat: -27.4698, lng: 153.0251 },
          owner: 'test-user-1',
          clan: 'test-clan',
          requiredNFT: 'trophy-1',
        },
      ],
    }).as('getUpdatedTerritories');

    // Process match result (simulating game completion)
    cy.window().then((win) => {
      win.postMessage(
        {
          type: 'MATCH_RESULT',
          challengeId: 'challenge-1',
          winnerId: 'test-user-1',
          score: { 'test-user-1': 7, 'player-2': 3 },
        },
        '*'
      );
    });

    cy.wait('@processMatchResult');
    cy.wait('@getUpdatedTerritories');

    // Verify territory ownership changed
    cy.get('[data-testid="territory-owner"]').should('contain', 'testuser');
  });

  it('should display NFT requirements for territories', () => {
    cy.visit('/');

    // Mock territories with NFT requirements
    cy.intercept('GET', '/api/territories', {
      statusCode: 200,
      body: [
        {
          id: 'territory-1',
          name: 'Legendary Dojo',
          coordinates: { lat: -27.4698, lng: 153.0251 },
          owner: 'player-1',
          clan: 'test-clan',
          requiredNFT: 'legendary-trophy',
        },
      ],
    }).as('getTerritories');

    // Mock user NFTs
    cy.intercept('GET', '/api/user-nfts/test-user-1', {
      statusCode: 200,
      body: [
        {
          id: 'nft-1',
          tokenId: 'legendary-trophy',
          name: 'Legendary Trophy',
          type: 'trophy',
        },
      ],
    }).as('getUserNFTs');

    // Navigate to map
    cy.get('[data-testid="map-tab"]').click();
    cy.wait('@getTerritories');
    cy.wait('@getUserNFTs');

    // Click on territory with NFT requirement
    cy.get('[data-testid="territory-marker"]').first().click();

    // Verify NFT requirement is displayed
    cy.get('[data-testid="nft-requirement"]').should(
      'contain',
      'Legendary Trophy'
    );
    cy.get('[data-testid="nft-requirement"]').should('have.class', 'unlocked');
  });

  it('should show locked state for territories without required NFT', () => {
    cy.visit('/');

    // Mock territories with NFT requirements
    cy.intercept('GET', '/api/territories', {
      statusCode: 200,
      body: [
        {
          id: 'territory-1',
          name: 'Legendary Dojo',
          coordinates: { lat: -27.4698, lng: 153.0251 },
          owner: 'player-1',
          clan: 'test-clan',
          requiredNFT: 'legendary-trophy',
        },
      ],
    }).as('getTerritories');

    // Mock user without required NFT
    cy.intercept('GET', '/api/user-nfts/test-user-1', {
      statusCode: 200,
      body: [],
    }).as('getUserNFTs');

    // Navigate to map
    cy.get('[data-testid="map-tab"]').click();
    cy.wait('@getTerritories');
    cy.wait('@getUserNFTs');

    // Click on territory with NFT requirement
    cy.get('[data-testid="territory-marker"]').first().click();

    // Verify territory is locked
    cy.get('[data-testid="nft-requirement"]').should('have.class', 'locked');
    cy.get('[data-testid="challenge-button"]').should('be.disabled');
  });

  it('should display clan territories on map', () => {
    cy.visit('/');

    // Mock territories by clan
    cy.intercept('GET', '/api/clans/test-clan/territories', {
      statusCode: 200,
      body: [
        {
          id: 'territory-1',
          name: 'Test Dojo',
          coordinates: { lat: -27.4698, lng: 153.0251 },
          owner: 'test-user-1',
          clan: 'test-clan',
          requiredNFT: 'trophy-1',
        },
      ],
    }).as('getClanTerritories');

    // Navigate to clan view
    cy.get('[data-testid="clan-tab"]').click();
    cy.get('[data-testid="clan-territories-button"]').click();
    cy.wait('@getClanTerritories');

    // Verify clan territories are displayed
    cy.get('[data-testid="territory-marker"]').should('have.length', 1);
    cy.get('[data-testid="territory-name"]').should('contain', 'Test Dojo');
  });

  it('should handle challenge expiration', () => {
    cy.visit('/');

    // Mock expired challenge
    cy.intercept('GET', '/api/users/test-user-1/challenges', {
      statusCode: 200,
      body: [
        {
          id: 'challenge-1',
          territoryId: 'territory-1',
          challengerId: 'player-2',
          defenderId: 'test-user-1',
          status: 'expired',
          expiresAt: '2025-01-30T09:00:00Z',
        },
      ],
    }).as('getUserChallenges');

    // Navigate to challenges
    cy.get('[data-testid="challenges-tab"]').click();
    cy.wait('@getUserChallenges');

    // Verify expired challenge is displayed
    cy.get('[data-testid="challenge-status"]').should('contain', 'Expired');
    cy.get('[data-testid="accept-challenge-button"]').should('not.exist');
    cy.get('[data-testid="decline-challenge-button"]').should('not.exist');
  });

  it('should display territory statistics', () => {
    cy.visit('/');

    // Mock territory statistics
    cy.intercept('GET', '/api/territories/statistics', {
      statusCode: 200,
      body: {
        total_territories: 10,
        total_challenges: 25,
        active_challenges: 5,
        territories_owned: 3,
      },
    }).as('getTerritoryStats');

    // Navigate to statistics
    cy.get('[data-testid="stats-tab"]').click();
    cy.wait('@getTerritoryStats');

    // Verify statistics are displayed
    cy.get('[data-testid="total-territories"]').should('contain', '10');
    cy.get('[data-testid="total-challenges"]').should('contain', '25');
    cy.get('[data-testid="active-challenges"]').should('contain', '5');
    cy.get('[data-testid="territories-owned"]').should('contain', '3');
  });

  it('should search territories', () => {
    cy.visit('/');

    // Mock territory search
    cy.intercept('GET', '/api/territories/search?q=test', {
      statusCode: 200,
      body: [
        {
          id: 'territory-1',
          name: 'Test Dojo',
          coordinates: { lat: -27.4698, lng: 153.0251 },
          owner: 'player-1',
          clan: 'test-clan',
          requiredNFT: 'trophy-1',
        },
      ],
    }).as('searchTerritories');

    // Navigate to map
    cy.get('[data-testid="map-tab"]').click();

    // Search for territories
    cy.get('[data-testid="territory-search"]').type('test');
    cy.get('[data-testid="search-button"]').click();
    cy.wait('@searchTerritories');

    // Verify search results
    cy.get('[data-testid="territory-marker"]').should('have.length', 1);
    cy.get('[data-testid="territory-name"]').should('contain', 'Test Dojo');
  });

  it('should handle network errors gracefully', () => {
    cy.visit('/');

    // Mock network error
    cy.intercept('GET', '/api/territories', {
      statusCode: 500,
      body: { error: 'Internal server error' },
    }).as('getTerritoriesError');

    // Navigate to map
    cy.get('[data-testid="map-tab"]').click();
    cy.wait('@getTerritoriesError');

    // Verify error handling
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="retry-button"]').should('be.visible');
  });

  it('should handle real-time updates via WebSocket', () => {
    cy.visit('/');

    // Mock WebSocket connection
    cy.window().then((win) => {
      // Simulate WebSocket message
      win.postMessage(
        {
          type: 'TERRITORY_UPDATE',
          territory: {
            id: 'territory-1',
            name: 'Updated Dojo',
            owner: 'test-user-1',
          },
        },
        '*'
      );
    });

    // Verify real-time update
    cy.get('[data-testid="territory-name"]').should('contain', 'Updated Dojo');
    cy.get('[data-testid="territory-owner"]').should('contain', 'testuser');
  });
});

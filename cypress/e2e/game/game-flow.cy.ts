describe('Game Flow', () => {
  beforeEach(() => {
    cy.visit('/games/create');
  });

  it('should create and play a game', () => {
    // Create a new game
    cy.get('[data-testid="game-type"]').select('casual');
    cy.get('[data-testid="opponent-select"]').select('Player 2');
    cy.get('[data-testid="venue-select"]').select('Venue 1');
    cy.get('[data-testid="create-game-button"]').click();

    // Verify game creation
    cy.url().should('match', /\/games\/[\w-]+$/);
    cy.get('[data-testid="game-controls"]').should('exist');

    // Simulate game play
    cy.get('[data-testid="ball-1"]').click();
    cy.get('[data-testid="pot-button"]').click();
    
    // Verify score update
    cy.get('[data-testid="player1-score"]').should('contain', '1');
  });

  it('should track game statistics correctly', () => {
    cy.createGame('player1', 'player2');

    // Make some shots
    cy.findByRole('button', { name: '1' }).click();
    cy.findByRole('button', { name: '2' }).click();

    // Check statistics
    cy.findByText(/Successful Shots: 2/i).should('exist');
    cy.findByText(/Total Shots: 2/i).should('exist');
    cy.findByText(/100.0%/i).should('exist'); // Accuracy
  });

  it('should show game history', () => {
    cy.createGame('player1', 'player2');

    // Make some moves
    cy.findByRole('button', { name: '1' }).click();
    cy.findByRole('button', { name: 'End Turn' }).click();

    // Check history
    cy.findByText('Game History').click();
    cy.findByText(/SHOT/).should('exist');
    cy.findByText(/Player 1/).should('exist');
  });

  it('should handle game patterns analysis', () => {
    cy.createGame('player1', 'player2');

    // Play multiple shots
    ['1', '2', '3'].forEach(ball => {
      cy.findByRole('button', { name: ball }).click();
    });

    // Check patterns
    cy.findByText('Shot Distribution').should('exist');
    cy.findByText('Player Positioning').should('exist');
    cy.findByText('Common Sequences').should('exist');
  });

  it('should update game map with player positions', () => {
    cy.createGame('player1', 'player2');

    // Verify map elements
    cy.findByTestId('google-map').should('exist');
    cy.findByTestId('map-circle').should('exist');

    // Mock location update
    cy.window().then(win => {
      const mockGeolocation = {
        getCurrentPosition: (cb: Function) => {
          cb({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060
            }
          });
        }
      };
      // @ts-ignore
      win.navigator.geolocation = mockGeolocation;
    });

    // Verify position update
    cy.findByTestId('player-marker').should('exist');
  });

  it('should handle network issues gracefully', () => {
    // Simulate offline state
    cy.window().then(win => {
      // @ts-ignore
      win.navigator.onLine = false;
      win.dispatchEvent(new Event('offline'));
    });

    cy.createGame('player1', 'player2');

    // Should show offline warning
    cy.findByText(/You are offline/i).should('exist');

    // Restore online state
    cy.window().then(win => {
      // @ts-ignore
      win.navigator.onLine = true;
      win.dispatchEvent(new Event('online'));
    });

    // Warning should disappear
    cy.findByText(/You are offline/i).should('not.exist');
  });
}); 
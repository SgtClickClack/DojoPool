describe('Game Flow', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
  });

  // TODO: Re-enable once game session UI is fully implemented
  it.skip('should create and play a complete game', () => {
    // Create new game
    cy.createGame('player1', 'player2');

    // Navigate to game session page
    cy.visit('/games/1');
    cy.findByText('Game Controls').should('exist');

    // Simulate game play
    // Click ball buttons
    cy.findByRole('button', { name: '1' }).click();
    cy.findByRole('button', { name: '2' }).click();
    cy.findByRole('button', { name: '3' }).click();

    // End turn
    cy.findByRole('button', { name: 'End Turn' }).click();

    // Verify turn change
    cy.findByText(/Player 2's turn/i).should('exist');

    // End game
    cy.findByRole('button', { name: 'End Game' }).click();

    // Verify game completion
    cy.findByText(/Game Complete/i).should('exist');
  });

  // TODO: Re-enable once game statistics tracking is implemented
  it.skip('should track game statistics correctly', () => {
    cy.createGame('player1', 'player2');

    // Navigate to game session page
    cy.visit('/games/1');

    // Make some shots
    cy.findByRole('button', { name: '1' }).click();
    cy.findByRole('button', { name: '2' }).click();

    // Check statistics
    cy.findByText(/Successful Shots: 2/i).should('exist');
    cy.findByText(/Total Shots: 2/i).should('exist');
    cy.findByText(/100.0%/i).should('exist'); // Accuracy
  });

  // TODO: Re-enable once game history feature is implemented
  it.skip('should show game history', () => {
    cy.createGame('player1', 'player2');

    // Navigate to game session page
    cy.visit('/games/1');

    // Make some moves
    cy.findByRole('button', { name: '1' }).click();
    cy.findByRole('button', { name: 'End Turn' }).click();

    // Check history
    cy.findByText('Game History').click();
    cy.findByText(/SHOT/).should('exist');
    cy.findByText(/Player 1/).should('exist');
  });

  // TODO: Re-enable once game patterns analysis feature is implemented
  it.skip('should handle game patterns analysis', () => {
    cy.createGame('player1', 'player2');

    // Play multiple shots
    ['1', '2', '3'].forEach((ball) => {
      cy.findByRole('button', { name: ball }).click();
    });

    // Check patterns
    cy.findByText('Shot Distribution').should('exist');
    cy.findByText('Player Positioning').should('exist');
    cy.findByText('Common Sequences').should('exist');
  });

  // TODO: Re-enable once game map integration is implemented
  it.skip('should update game map with player positions', () => {
    cy.createGame('player1', 'player2');

    // Verify map elements
    cy.findByTestId('google-map').should('exist');
    cy.findByTestId('map-circle').should('exist');

    // Mock location update
    cy.window().then((win) => {
      const mockGeolocation = {
        getCurrentPosition: (cb: Function) => {
          cb({
            coords: {
              latitude: 40.7128,
              longitude: -74.006,
            },
          });
        },
      };
      // Use Object.defineProperty instead of direct assignment to readonly property
      Object.defineProperty(win.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });
    });

    // Verify position update
    cy.findByTestId('player-marker').should('exist');
  });

  it('should handle network issues gracefully', () => {
    // Simulate offline state
    cy.window().then((win) => {
      // Use Object.defineProperty instead of direct assignment to readonly property
      Object.defineProperty(win.navigator, 'onLine', {
        value: false,
        configurable: true,
      });
      win.dispatchEvent(new Event('offline'));
    });

    cy.createGame('player1', 'player2');

    // Should show offline warning
    cy.findByText(/You are offline/i).should('exist');

    // Restore online state
    cy.window().then((win) => {
      // Use Object.defineProperty instead of direct assignment to readonly property
      Object.defineProperty(win.navigator, 'onLine', {
        value: true,
        configurable: true,
      });
      win.dispatchEvent(new Event('online'));
    });

    // Warning should disappear
    cy.findByText(/You are offline/i).should('not.exist');
  });
});

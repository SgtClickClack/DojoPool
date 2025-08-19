describe('Multiplayer Game Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('POST', '/api/game/create').as('createGame');
    cy.intercept('POST', '/api/game/join').as('joinGame');
  });

  it('creates and joins a multiplayer game', () => {
    // Create game
    cy.get('[data-testid=create-game-btn]').click();
    cy.wait('@createGame');

    // Get game code
    cy.get('[data-testid=game-code]')
      .invoke('text')
      .then((gameCode) => {
        // Open new tab and join game
        cy.visit('/');
        cy.get('[data-testid=join-game-input]').type(gameCode);
        cy.get('[data-testid=join-game-btn]').click();
        cy.wait('@joinGame');

        // Verify both players connected
        cy.get('[data-testid=player-1-status]').should(
          'have.text',
          'Connected'
        );
        cy.get('[data-testid=player-2-status]').should(
          'have.text',
          'Connected'
        );
      });
  });

  it('synchronizes game state between players', () => {
    // Set up game with two players
    cy.get('[data-testid=create-game-btn]').click();
    cy.wait('@createGame');

    // Player 1 takes shot
    cy.get('[data-testid=shot-power]').type('75');
    cy.get('[data-testid=shot-angle]').type('45');
    cy.get('[data-testid=shot-button]').click();

    // Verify state sync
    cy.get('[data-testid=game-state]').should('have.attr', 'data-turn', '2');
    cy.get('[data-testid=player-1-score]').should('not.have.text', '0');
  });

  it('handles disconnection and reconnection', () => {
    cy.get('[data-testid=create-game-btn]').click();
    cy.wait('@createGame');

    // Simulate disconnection
    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'));
    });

    // Verify disconnect handling
    cy.get('[data-testid=connection-status]').should(
      'have.text',
      'Disconnected'
    );

    // Simulate reconnection
    cy.window().then((win) => {
      win.dispatchEvent(new Event('online'));
    });

    // Verify reconnection
    cy.get('[data-testid=connection-status]').should('have.text', 'Connected');
    cy.get('[data-testid=game-state]').should('exist');
  });

  it('handles game chat functionality', () => {
    cy.get('[data-testid=create-game-btn]').click();
    cy.wait('@createGame');

    // Open chat
    cy.get('[data-testid=chat-toggle]').click();

    // Send message
    cy.get('[data-testid=chat-input]').type('Good game!{enter}');

    // Verify message appears
    cy.get('[data-testid=chat-messages]').should('contain', 'Good game!');
  });

  it('manages spectator mode correctly', () => {
    // Create game
    cy.get('[data-testid=create-game-btn]').click();
    cy.wait('@createGame');

    // Get game code and join as spectator
    cy.get('[data-testid=game-code]')
      .invoke('text')
      .then((gameCode) => {
        cy.visit(`/spectate/${gameCode}`);

        // Verify spectator view
        cy.get('[data-testid=spectator-view]').should('exist');
        cy.get('[data-testid=shot-button]').should('not.exist');

        // Verify live updates
        cy.get('[data-testid=game-state]').should('exist');
      });
  });
});

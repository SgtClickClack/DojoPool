describe('Game Play E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete a full game session', () => {
    // Start new game
    cy.get('[data-testid=start-game]').click();

    // Verify game initialization
    cy.get('[data-testid=game-board]').should('be.visible');
    cy.get('[data-testid=player-1-turn]').should('be.visible');

    // Play multiple turns
    cy.get('[data-testid=game-board]').click();
    cy.get('[data-testid=player-2-turn]').should('be.visible');

    // Verify score updates
    cy.get('[data-testid=player-1-score]').should('not.have.text', '0');

    // Complete game
    cy.get('[data-testid=game-winner]', { timeout: 10000 }).should(
      'be.visible'
    );
  });

  it('should handle player interactions correctly', () => {
    cy.get('[data-testid=start-game]').click();

    // Test menu interactions
    cy.get('[data-testid=game-menu]').click();
    cy.get('[data-testid=pause-game]').should('be.visible');

    // Test shot controls
    cy.get('[data-testid=shot-power]').should('be.visible');
    cy.get('[data-testid=shot-angle]').should('be.visible');

    // Verify UI responsiveness
    cy.viewport('iphone-x');
    cy.get('[data-testid=game-board]').should('be.visible');
  });

  it('should persist game state', () => {
    cy.get('[data-testid=start-game]').click();

    // Play some turns
    cy.get('[data-testid=game-board]').click();

    // Reload page
    cy.reload();

    // Verify game state persisted
    cy.get('[data-testid=game-board]').should('be.visible');
    cy.get('[data-testid=current-score]').should('not.have.text', '0');
  });
});

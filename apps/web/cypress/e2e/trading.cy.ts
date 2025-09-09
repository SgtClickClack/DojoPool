describe('Player Trading System', () => {
  beforeEach(() => {
    // Mock authentication and API responses
    cy.intercept('GET', '/api/v1/trading/pending/*', {
      fixture: 'pending-trades.json',
    }).as('getPendingTrades');
    cy.intercept('GET', '/api/v1/trading/history/*', {
      fixture: 'trade-history.json',
    }).as('getTradeHistory');
    cy.intercept('POST', '/api/v1/trading/propose', {
      id: 'new-trade-123',
      status: 'PENDING',
    }).as('createTradeProposal');
    cy.intercept('POST', '/api/v1/trading/respond', { status: 'ACCEPTED' }).as(
      'respondToTrade'
    );
    cy.intercept('DELETE', '/api/v1/trading/*/cancel/*', {
      status: 'CANCELLED',
    }).as('cancelTrade');

    cy.visit('/trading');
  });

  it('should display trading interface with tabs', () => {
    cy.wait('@getPendingTrades');
    cy.wait('@getTradeHistory');

    // Check page title
    cy.contains('Player Trading').should('be.visible');

    // Check tab navigation
    cy.contains('Pending Trades').should('be.visible');
    cy.contains('Trade History').should('be.visible');

    // Check create proposal button
    cy.contains('Create Trade Proposal').should('be.visible');
  });

  it('should display pending trades', () => {
    cy.wait('@getPendingTrades');

    // Check pending trades tab is active
    cy.get('[data-testid="pending-trades-tab"]').should(
      'have.class',
      'Mui-selected'
    );

    // Check trade cards are displayed
    cy.get('[data-testid="trade-card"]').should('have.length.greaterThan', 0);

    // Check trade card content
    cy.get('[data-testid="trade-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="proposer-avatar"]').should('be.visible');
        cy.get('[data-testid="trade-participants"]').should(
          'contain',
          'TestUser1'
        );
        cy.get('[data-testid="trade-participants"]').should(
          'contain',
          'TestUser2'
        );
        cy.get('[data-testid="trade-status"]').should('contain', 'PENDING');
        cy.get('[data-testid="trade-offer-amount"]').should('be.visible');
        cy.get('[data-testid="trade-request-amount"]').should('be.visible');
        cy.get('[data-testid="view-details-button"]').should('be.visible');
      });
  });

  it('should switch between pending trades and history', () => {
    cy.wait('@getPendingTrades');
    cy.wait('@getTradeHistory');

    // Check initial state - pending trades
    cy.get('[data-testid="pending-trades-tab"]').should(
      'have.class',
      'Mui-selected'
    );
    cy.get('[data-testid="trade-card"]').should('have.length.greaterThan', 0);

    // Switch to history tab
    cy.get('[data-testid="trade-history-tab"]').click();
    cy.get('[data-testid="trade-history-tab"]').should(
      'have.class',
      'Mui-selected'
    );

    // Check history trades are displayed
    cy.get('[data-testid="history-trade-card"]').should(
      'have.length.greaterThan',
      0
    );

    // Switch back to pending
    cy.get('[data-testid="pending-trades-tab"]').click();
    cy.get('[data-testid="pending-trades-tab"]').should(
      'have.class',
      'Mui-selected'
    );
  });

  it('should create a new trade proposal', () => {
    cy.contains('Create Trade Proposal').click();

    // Fill proposal form
    cy.get('[data-testid="recipient-id-input"]').type('user456');
    cy.get('[data-testid="expiration-select"]').click();
    cy.contains('24 hours').click();
    cy.get('[data-testid="proposer-coins-input"]').type('100');
    cy.get('[data-testid="recipient-coins-input"]').type('50');
    cy.get('[data-testid="trade-message-input"]').type('Great trade offer!');

    // Submit proposal
    cy.get('[data-testid="create-proposal-button"]').click();

    // Wait for API call
    cy.wait('@createTradeProposal');

    // Check success feedback
    cy.contains('Trade proposal created successfully').should('be.visible');
  });

  it('should view trade details', () => {
    cy.wait('@getPendingTrades');

    // Click view details on first trade
    cy.get('[data-testid="trade-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="view-details-button"]').click();
      });

    // Check trade details dialog
    cy.get('[data-testid="trade-details-dialog"]').should('be.visible');
    cy.contains('Trade Details').should('be.visible');

    // Check trade details content
    cy.get('[data-testid="proposer-offer-card"]').should('be.visible');
    cy.get('[data-testid="recipient-offer-card"]').should('be.visible');
    cy.get('[data-testid="trade-message"]').should('be.visible');
  });

  it('should accept a trade proposal', () => {
    cy.wait('@getPendingTrades');

    // Open trade details
    cy.get('[data-testid="trade-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="view-details-button"]').click();
      });

    // Click accept button
    cy.get('[data-testid="accept-trade-button"]').click();

    // Confirm acceptance in dialog
    cy.get('[data-testid="confirm-accept-dialog"]').should('be.visible');
    cy.get('[data-testid="confirm-accept-button"]').click();

    // Wait for API call
    cy.wait('@respondToTrade');

    // Check success feedback
    cy.contains('Trade accepted successfully').should('be.visible');

    // Check trade moved to history
    cy.get('[data-testid="trade-history-tab"]').click();
    cy.get('[data-testid="history-trade-card"]').should('contain', 'ACCEPTED');
  });

  it('should reject a trade proposal', () => {
    cy.wait('@getPendingTrades');

    // Open trade details
    cy.get('[data-testid="trade-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="view-details-button"]').click();
      });

    // Click reject button
    cy.get('[data-testid="reject-trade-button"]').click();

    // Confirm rejection in dialog
    cy.get('[data-testid="confirm-reject-dialog"]').should('be.visible');
    cy.get('[data-testid="confirm-reject-button"]').click();

    // Wait for API call
    cy.wait('@respondToTrade');

    // Check success feedback
    cy.contains('Trade rejected').should('be.visible');

    // Check trade moved to history
    cy.get('[data-testid="trade-history-tab"]').click();
    cy.get('[data-testid="history-trade-card"]').should('contain', 'REJECTED');
  });

  it('should cancel a trade proposal', () => {
    cy.wait('@getPendingTrades');

    // Click cancel on first trade
    cy.get('[data-testid="trade-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="cancel-trade-button"]').click();
      });

    // Confirm cancellation
    cy.get('[data-testid="confirm-cancel-dialog"]').should('be.visible');
    cy.get('[data-testid="confirm-cancel-button"]').click();

    // Wait for API call
    cy.wait('@cancelTrade');

    // Check success feedback
    cy.contains('Trade cancelled successfully').should('be.visible');
  });

  it('should handle empty states', () => {
    // Mock empty responses
    cy.intercept('GET', '/api/v1/trading/pending/*', []).as(
      'getEmptyPendingTrades'
    );
    cy.intercept('GET', '/api/v1/trading/history/*', []).as(
      'getEmptyTradeHistory'
    );

    cy.visit('/trading');
    cy.wait('@getEmptyPendingTrades');
    cy.wait('@getEmptyTradeHistory');

    // Check empty state messages
    cy.contains('No pending trades').should('be.visible');
    cy.contains('Create a trade proposal to get started!').should('be.visible');

    // Switch to history tab
    cy.get('[data-testid="trade-history-tab"]').click();
    cy.contains('No trade history').should('be.visible');
    cy.contains('Your completed trades will appear here.').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/v1/trading/pending/*', {
      statusCode: 500,
      body: { message: 'Internal server error' },
    }).as('getTradesError');

    cy.visit('/trading');
    cy.wait('@getTradesError');

    // Check error message display
    cy.contains('Failed to load trades').should('be.visible');
  });

  it('should validate trade proposal form', () => {
    cy.contains('Create Trade Proposal').click();

    // Try to submit empty form
    cy.get('[data-testid="create-proposal-button"]').click();

    // Check validation messages
    cy.contains('Recipient ID is required').should('be.visible');
    cy.contains('Please enter valid amounts').should('be.visible');

    // Fill form with invalid data
    cy.get('[data-testid="recipient-id-input"]').type('invalid-user');
    cy.get('[data-testid="proposer-coins-input"]').type('-100');
    cy.get('[data-testid="create-proposal-button"]').click();

    // Check validation messages
    cy.contains('Invalid recipient').should('be.visible');
    cy.contains('Amount must be positive').should('be.visible');
  });
});

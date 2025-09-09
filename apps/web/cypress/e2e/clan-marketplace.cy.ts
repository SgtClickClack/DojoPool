describe('Clan Marketplace', () => {
  beforeEach(() => {
    // Mock authentication and API responses
    cy.intercept('GET', '/api/v1/marketplace/clan/*/listings', {
      fixture: 'clan-listings.json',
    }).as('getClanListings');
    cy.intercept('GET', '/api/v1/marketplace/clan/*/wallet', {
      fixture: 'clan-wallet.json',
    }).as('getClanWallet');
    cy.intercept('POST', '/api/v1/marketplace/clan/buy', {
      success: true,
      newBalance: 400,
    }).as('buyFromClanMarketplace');
    cy.intercept('POST', '/api/v1/marketplace/clan/wallet/deposit', {
      success: true,
      newUserBalance: 900,
      newClanBalance: 100,
    }).as('depositToClanWallet');
    cy.intercept('POST', '/api/v1/marketplace/clan/wallet/withdraw', {
      success: true,
      newClanBalance: 450,
    }).as('withdrawFromClanWallet');

    cy.visit('/clan-marketplace?clanId=test-clan-123');
  });

  it('should display clan marketplace with listings', () => {
    cy.wait('@getClanListings');
    cy.wait('@getClanWallet');

    // Check page title
    cy.contains('Clan Marketplace').should('be.visible');

    // Check clan wallet display
    cy.contains('Clan Wallet').should('be.visible');
    cy.contains('Current Balance').should('be.visible');
    cy.contains('500').should('be.visible'); // Mock balance

    // Check listings section
    cy.contains('Available Listings').should('be.visible');

    // Check if listings are displayed
    cy.get('[data-testid="clan-listing"]').should('have.length.greaterThan', 0);

    // Check listing content
    cy.get('[data-testid="clan-listing"]')
      .first()
      .within(() => {
        cy.get('[data-testid="seller-avatar"]').should('be.visible');
        cy.get('[data-testid="seller-username"]').should(
          'contain',
          'TestSeller'
        );
        cy.get('[data-testid="listing-price"]').should('contain', '100');
        cy.get('[data-testid="buy-button"]').should('be.visible');
      });
  });

  it('should allow buying from clan marketplace', () => {
    cy.wait('@getClanListings');
    cy.wait('@getClanWallet');

    // Click buy button on first listing
    cy.get('[data-testid="clan-listing"]')
      .first()
      .within(() => {
        cy.get('[data-testid="buy-button"]').click();
      });

    // Wait for purchase API call
    cy.wait('@buyFromClanMarketplace');

    // Check success message or updated balance
    cy.contains('Purchase successful').should('be.visible');
    cy.contains('400').should('be.visible'); // Updated balance
  });

  it('should show insufficient funds for expensive items', () => {
    cy.wait('@getClanListings');
    cy.wait('@getClanWallet');

    // Mock clan wallet with low balance
    cy.intercept('GET', '/api/v1/marketplace/clan/*/wallet', {
      balance: 50,
    }).as('getLowBalanceClanWallet');

    cy.reload();
    cy.wait('@getLowBalanceClanWallet');

    // Check that expensive items show insufficient funds
    cy.get('[data-testid="clan-listing"]').each(($listing) => {
      cy.wrap($listing).within(() => {
        const price = parseInt(
          $listing.find('[data-testid="listing-price"]').text()
        );
        if (price > 50) {
          cy.get('[data-testid="buy-button"]').should(
            'contain',
            'Insufficient Funds'
          );
          cy.get('[data-testid="buy-button"]').should('be.disabled');
        }
      });
    });
  });

  it('should allow depositing to clan wallet', () => {
    cy.wait('@getClanListings');
    cy.wait('@getClanWallet');

    // Open wallet management dialog
    cy.contains('Manage Wallet').click();

    // Fill deposit form
    cy.get('[data-testid="deposit-amount"]').type('100');
    cy.get('[data-testid="deposit-button"]').click();

    // Wait for deposit API call
    cy.wait('@depositToClanWallet');

    // Check success and updated balances
    cy.contains('Deposit successful').should('be.visible');
    cy.contains('900').should('be.visible'); // User balance
    cy.contains('100').should('be.visible'); // Clan balance
  });

  it('should allow withdrawing from clan wallet', () => {
    cy.wait('@getClanListings');
    cy.wait('@getClanWallet');

    // Open wallet management dialog
    cy.contains('Manage Wallet').click();

    // Fill withdrawal form
    cy.get('[data-testid="withdraw-amount"]').type('50');
    cy.get('[data-testid="withdraw-button"]').click();

    // Wait for withdrawal API call
    cy.wait('@withdrawFromClanWallet');

    // Check success and updated balance
    cy.contains('Withdrawal successful').should('be.visible');
    cy.contains('450').should('be.visible'); // Updated clan balance
  });

  it('should display transaction history', () => {
    cy.wait('@getClanListings');
    cy.wait('@getClanWallet');

    // Open wallet management dialog
    cy.contains('Manage Wallet').click();

    // Check transaction history section
    cy.contains('Recent Transactions').should('be.visible');

    // Check transaction items
    cy.get('[data-testid="transaction-item"]').should(
      'have.length.greaterThan',
      0
    );

    cy.get('[data-testid="transaction-item"]')
      .first()
      .within(() => {
        cy.get('[data-testid="transaction-description"]').should('be.visible');
        cy.get('[data-testid="transaction-amount"]').should('be.visible');
        cy.get('[data-testid="transaction-user"]').should('be.visible');
        cy.get('[data-testid="transaction-date"]').should('be.visible');
      });
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/v1/marketplace/clan/*/listings', {
      statusCode: 500,
      body: { message: 'Internal server error' },
    }).as('getClanListingsError');

    cy.visit('/clan-marketplace?clanId=test-clan-123');
    cy.wait('@getClanListingsError');

    // Check error message display
    cy.contains('Failed to load clan marketplace data').should('be.visible');
  });
});

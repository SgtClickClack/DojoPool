describe('Referral System', () => {
  const testUser = {
    email: 'referral-test@example.com',
    password: 'password123',
    username: 'referraltest',
  };

  const invitedUser = {
    email: 'invited-test@example.com',
    password: 'password123',
    username: 'invitedtest',
  };

  before(() => {
    // Clean up any existing test data
    cy.request({
      method: 'POST',
      url: '/api/auth/cleanup-test-data',
      body: { testIdentifier: 'referral-system-test' },
      failOnStatusCode: false,
    });
  });

  describe('Referral Dashboard', () => {
    beforeEach(() => {
      // Login as test user
      cy.login(testUser.email, testUser.password);
      cy.visit('/profile/referral');
    });

    it('should display referral dashboard with stats', () => {
      cy.contains('Referral Dashboard').should('be.visible');

      // Check stats cards
      cy.contains('Total Referrals').should('be.visible');
      cy.contains('Completed Referrals').should('be.visible');
      cy.contains('Pending Rewards').should('be.visible');
      cy.contains('Total Earned').should('be.visible');
    });

    it('should generate and display referral code', () => {
      cy.get('[data-cy="referral-code"]').should('be.visible');
      cy.get('[data-cy="referral-code"]')
        .invoke('val')
        .should('have.length', 8);
    });

    it('should allow copying referral code', () => {
      cy.get('[data-cy="copy-code-btn"]').click();
      cy.contains('Copied!').should('be.visible');
    });

    it('should display referral history table', () => {
      cy.contains('Referral History').should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should open share dialog', () => {
      cy.get('[data-cy="share-btn"]').click();
      cy.contains('Share Your Referral Code').should('be.visible');
      cy.get('[data-cy="share-dialog"]').should('be.visible');
    });
  });

  describe('Referral Code Validation', () => {
    it('should validate referral code on registration page', () => {
      cy.visit('/auth/register');

      // Enter a valid referral code
      cy.get('[data-cy="referral-code-input"]').type('VALID123');

      // Should show validation feedback
      cy.contains('Valid referral code').should('be.visible');
    });

    it('should show error for invalid referral code', () => {
      cy.visit('/auth/register');

      // Enter an invalid referral code
      cy.get('[data-cy="referral-code-input"]').type('INVALID');

      // Should show error feedback
      cy.contains('Invalid referral code').should('be.visible');
    });
  });

  describe('Referral Flow', () => {
    let referralCode: string;

    before(() => {
      // Get referral code from test user
      cy.login(testUser.email, testUser.password);
      cy.request('/api/v1/referral/code').then((response) => {
        referralCode = response.body.referralCode;
      });
    });

    it('should complete referral signup flow', () => {
      // Visit registration with referral code
      cy.visit(`/auth/register?ref=${referralCode}`);

      // Check that referral code is pre-filled
      cy.get('[data-cy="referral-code-input"]').should(
        'have.value',
        referralCode
      );

      // Fill registration form
      cy.get('[data-cy="username-input"]').type(invitedUser.username);
      cy.get('[data-cy="email-input"]').type(invitedUser.email);
      cy.get('[data-cy="password-input"]').type(invitedUser.password);
      cy.get('[data-cy="confirm-password-input"]').type(invitedUser.password);

      // Submit registration
      cy.get('[data-cy="register-btn"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // Check that both users received rewards
      cy.login(testUser.email, testUser.password);
      cy.visit('/profile/referral');

      // Should show completed referral
      cy.contains('Completed').should('be.visible');
    });

    it('should update referral stats after signup', () => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/profile/referral');

      // Check updated stats
      cy.get('[data-cy="total-referrals"]').should('contain', '1');
      cy.get('[data-cy="completed-referrals"]').should('contain', '1');
      cy.get('[data-cy="total-earned"]').should('contain', '100'); // Inviter reward
    });

    it('should show referral rewards in invited user balance', () => {
      cy.login(invitedUser.email, invitedUser.password);

      // Check wallet balance includes referral reward
      cy.get('[data-cy="wallet-balance"]').should('contain', '50'); // Invitee reward
    });
  });

  describe('DojoCoin Purchase Flow', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
    });

    it('should display wallet in header', () => {
      cy.get('[data-cy="wallet-display"]').should('be.visible');
      cy.get('[data-cy="wallet-display"]').should('contain', 'DojoCoins');
    });

    it('should open purchase dialog', () => {
      cy.get('[data-cy="buy-coins-btn"]').click();
      cy.contains('Purchase DojoCoins').should('be.visible');
    });

    it('should complete purchase flow', () => {
      cy.get('[data-cy="buy-coins-btn"]').click();

      // Fill purchase form
      cy.get('[data-cy="purchase-amount"]').type('100');
      cy.get('[data-cy="purchase-submit"]').click();

      // Should show success message
      cy.contains('Purchase completed').should('be.visible');

      // Balance should be updated
      cy.get('[data-cy="wallet-balance"]').should('contain', '100');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid referral codes gracefully', () => {
      cy.visit('/auth/register?ref=INVALID123');

      cy.get('[data-cy="referral-code-input"]').should(
        'have.value',
        'INVALID123'
      );
      cy.contains('Invalid referral code').should('be.visible');

      // Should still allow registration
      cy.get('[data-cy="register-btn"]').should('not.be.disabled');
    });

    it('should handle network errors during referral processing', () => {
      // Mock network failure
      cy.intercept('POST', '/api/v1/referral/process-signup', {
        statusCode: 500,
        body: { message: 'Server error' },
      });

      cy.visit('/auth/register?ref=VALID123');

      // Fill and submit form
      cy.get('[data-cy="username-input"]').type('testuser');
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="confirm-password-input"]').type('password123');
      cy.get('[data-cy="register-btn"]').click();

      // Should still complete registration despite referral error
      cy.url().should('include', '/dashboard');
    });
  });
});

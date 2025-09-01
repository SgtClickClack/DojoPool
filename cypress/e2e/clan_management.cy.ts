describe('Clan Management', () => {
  beforeEach(() => {
    // Mock authentication and user data
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        id: 'test-user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        avatar: 'avatar-1',
      },
    }).as('getUser');

    // Mock clans API
    cy.intercept('GET', '/api/v1/clans*', {
      statusCode: 200,
      body: [
        {
          id: 'existing-clan-1',
          name: 'Phoenix Warriors',
          tag: 'PHX',
          description: 'A legendary clan of pool masters',
          members: 15,
          territories: 3,
          rating: 1850,
          isPublic: true,
          requirements: {
            minRating: 1500,
            minLevel: 10,
            invitationOnly: false,
            approvalRequired: false,
          },
        },
      ],
    }).as('getClans');

    // Mock clan creation API
    cy.intercept('POST', '/api/v1/clans', {
      statusCode: 201,
      body: {
        id: 'new-clan-123',
        name: 'Test Clan',
        tag: 'TEST',
        description: 'A test clan for E2E testing',
        members: 1,
        territories: 0,
        rating: 1000,
        isPublic: true,
        requirements: {
          minRating: undefined,
          minLevel: undefined,
          invitationOnly: false,
          approvalRequired: false,
        },
      },
    }).as('createClan');
  });

  describe('Create Clan Flow', () => {
    it('should complete the entire clan creation journey', () => {
      // Step 1: Login using custom command
      cy.login('test@example.com', process.env.TEST_USER_PASSWORD || 'test-password');
      cy.url().should('include', '/dashboard');

      // Step 2: Navigate to clan creation page
      cy.visit('/clans/create');
      cy.url().should('include', '/clans/create');

      // Verify page elements are present
      cy.findByText('Create New Clan').should('exist');
      cy.findByText(/Build your own community/).should('exist');

      // Step 3: Fill out the Create Clan form
      cy.findByLabelText(/clan name/i).type('Test Clan');
      cy.findByLabelText(/clan tag/i).type('TEST');
      cy.findByLabelText(/description/i).type(
        'A test clan for E2E testing purposes'
      );

      // Toggle public/private setting
      cy.findByLabelText(/public clan/i).should('be.checked');
      cy.findByLabelText(/public clan/i).click();
      cy.findByLabelText(/public clan/i).should('not.be.checked');

      // Set minimum rating requirement
      cy.findByLabelText(/minimum rating/i).type('1500');

      // Set minimum level requirement
      cy.findByLabelText(/minimum level/i).type('10');

      // Enable invitation only
      cy.findByLabelText(/invitation only/i).click();
      cy.findByLabelText(/invitation only/i).should('be.checked');

      // Enable approval required
      cy.findByLabelText(/approval required/i).click();
      cy.findByLabelText(/approval required/i).should('be.checked');

      // Step 4: Submit the form
      cy.findByRole('button', { name: /create clan/i }).click();

      // Wait for API call
      cy.wait('@createClan');

      // Step 5: Assert successful creation and redirect
      cy.findByText(/clan created successfully/i).should('exist');
      cy.findByText(/redirecting to clan page/i).should('exist');

      // Verify redirect to new clan's profile page
      cy.url().should('include', '/clans/new-clan-123');
    });

    it('should validate required fields', () => {
      cy.login('test@example.com', process.env.TEST_USER_PASSWORD || 'test-password');
      cy.visit('/clans/create');

      // Try to submit without required fields
      cy.findByRole('button', { name: /create clan/i }).click();

      // Verify validation errors
      cy.findByText(/clan name is required/i).should('exist');
      cy.findByText(/clan tag is required/i).should('exist');
      cy.findByText(/clan description is required/i).should('exist');
    });

    it('should validate clan tag length', () => {
      cy.login('test@example.com', process.env.TEST_USER_PASSWORD || 'test-password');
      cy.visit('/clans/create');

      // Fill required fields
      cy.findByLabelText(/clan name/i).type('Test Clan');
      cy.findByLabelText(/description/i).type('A test clan');

      // Test tag too short
      cy.findByLabelText(/clan tag/i).type('A');
      cy.findByRole('button', { name: /create clan/i }).click();
      cy.findByText(/clan tag must be between 2-5 characters/i).should('exist');

      // Test tag too long
      cy.findByLabelText(/clan tag/i)
        .clear()
        .type('TOOLONG');
      cy.findByRole('button', { name: /create clan/i }).click();
      cy.findByText(/clan tag must be between 2-5 characters/i).should('exist');

      // Test valid tag
      cy.findByLabelText(/clan tag/i)
        .clear()
        .type('TEST');
      cy.findByRole('button', { name: /create clan/i }).click();
      // Should not show tag length error
      cy.findByText(/clan tag must be between 2-5 characters/i).should(
        'not.exist'
      );
    });
  });

  describe('Clan Discovery', () => {
    it('should display newly created clan in discovery page', () => {
      cy.login('test@example.com', process.env.TEST_USER_PASSWORD || 'test-password');

      // First create a clan
      cy.visit('/clans/create');
      cy.findByLabelText(/clan name/i).type('Discovery Test Clan');
      cy.findByLabelText(/clan tag/i).type('DISC');
      cy.findByLabelText(/description/i).type('A clan to test discovery');
      cy.findByRole('button', { name: /create clan/i }).click();
      cy.wait('@createClan');

      // Navigate to clans discovery page
      cy.visit('/clans');
      cy.url().should('include', '/clans');

      // Verify page elements
      cy.findByText('Clan Discovery').should('exist');
      cy.findByText(/Discover and join clans/).should('exist');

      // Verify the newly created clan is visible
      cy.findByText('Discovery Test Clan').should('exist');
      cy.findByText('DISC').should('exist');
      cy.findByText(/A clan to test discovery/).should('exist');

      // Verify clan card elements
      cy.findByText('Discovery Test Clan')
        .closest('[data-testid="clan-card"]')
        .within(() => {
          cy.findByText('DISC').should('exist');
          cy.findByText(/1 member/).should('exist');
          cy.findByText(/0 territories/).should('exist');
          cy.findByText(/1000 rating/).should('exist');
        });
    });

    it('should handle search and filtering', () => {
      cy.login('test@example.com', process.env.TEST_USER_PASSWORD || 'test-password');
      cy.visit('/clans');

      // Test search functionality
      cy.findByLabelText(/search clans/i).type('Phoenix');
      cy.findByRole('button', { name: /search/i }).click();

      // Verify search results
      cy.findByText('Phoenix Warriors').should('exist');
      cy.findByText('1 clan found').should('exist');

      // Test filter reset
      cy.findByRole('button', { name: /reset/i }).click();
      cy.findByText('1 clan found').should('exist');

      // Test sorting
      cy.findByLabelText(/sort by/i).click();
      cy.findByText('Rating').click();
      cy.findByLabelText(/sort order/i).click();
      cy.findByText('Ascending').click();
    });

    it('should handle empty search results', () => {
      cy.login('test@example.com', process.env.TEST_USER_PASSWORD || 'test-password');
      cy.visit('/clans');

      // Search for non-existent clan
      cy.findByLabelText(/search clans/i).type('NonExistentClan');
      cy.findByRole('button', { name: /search/i }).click();

      // Verify no results message
      cy.findByText('No clans found').should('exist');
      cy.findByText(/Try adjusting your search terms/).should('exist');
    });
  });

  describe('Clan Creation Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('POST', '/api/v1/clans', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('createClanError');

      cy.login('test@example.com', process.env.TEST_USER_PASSWORD || 'test-password');
      cy.visit('/clans/create');

      // Fill form
      cy.findByLabelText(/clan name/i).type('Error Test Clan');
      cy.findByLabelText(/clan tag/i).type('ERR');
      cy.findByLabelText(/description/i).type('Testing error handling');
      cy.findByRole('button', { name: /create clan/i }).click();

      // Wait for error response
      cy.wait('@createClanError');

      // Verify error message
      cy.findByText(/failed to create clan/i).should('exist');
    });

    it('should handle network timeouts', () => {
      // Mock network timeout
      cy.intercept('POST', '/api/v1/clans', {
        forceNetworkError: true,
      }).as('createClanTimeout');

      cy.login('test@example.com', process.env.TEST_USER_PASSWORD || 'test-password');
      cy.visit('/clans/create');

      // Fill form
      cy.findByLabelText(/clan name/i).type('Timeout Test Clan');
      cy.findByLabelText(/clan tag/i).type('TMO');
      cy.findByLabelText(/description/i).type('Testing timeout handling');
      cy.findByRole('button', { name: /create clan/i }).click();

      // Wait for timeout
      cy.wait('createClanTimeout');

      // Verify error message
      cy.findByText(/failed to create clan/i).should('exist');
    });
  });
});

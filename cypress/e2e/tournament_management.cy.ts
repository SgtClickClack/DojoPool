describe('Tournament Management - Venue Owner Workflow', () => {
  beforeEach(() => {
    // Clear any existing session data
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Venue Owner Tournament Creation Journey', () => {
    it('should successfully create and view a new tournament as venue owner', () => {
      // Generate unique test data for this test run
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';
      const tournamentName = `E2E Test Tournament ${Date.now()}`;

      // Step 1: Register and login as a venue owner
      cy.register(uniqueEmail, password);
      cy.wait(1000); // Wait for registration to complete

      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Step 2: Navigate to Venue Dashboard
      cy.visit('/venue/dashboard');
      cy.get('body').should('be.visible');

      // Wait for venue dashboard to load
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Step 3: Click Create Tournament button
      cy.get('button')
        .contains('🏆 Create Tournament')
        .should('be.visible')
        .click();

      // Step 4: Fill out tournament creation form with test data
      cy.get('[name=name]').should('be.visible').type(tournamentName);
      cy.get('[name=description]').type(
        'A comprehensive E2E test tournament for venue owners'
      );

      // Select tournament type
      cy.get('[name=tournamentType]').select('SINGLE_ELIMINATION');

      // Select game type
      cy.get('[name=gameType]').select('8_BALL');

      // Set max participants
      cy.get('[name=maxParticipants]').clear().type('16');

      // Set entry fee
      cy.get('[name=entryFee]').clear().type('50');

      // Set start date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().slice(0, 16);
      cy.get('[name=startDate]').type(startDate);

      // Set end date (day after tomorrow)
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const endDate = dayAfterTomorrow.toISOString().slice(0, 16);
      cy.get('[name=endDate]').type(endDate);

      // Add tournament rules
      cy.get('[name=rules]').type(
        'Standard 8-ball rules apply. No coaching allowed during matches. All shots must be called clearly.'
      );

      // Step 5: Submit the form
      cy.get('button[type=submit]').should('be.enabled').click();

      // Step 6: Verify tournament creation success
      // The modal should close and we should be back on the dashboard
      cy.get('[name=name]').should('not.exist'); // Form should not be visible

      // Step 7: Verify new tournament appears in the tournament list
      cy.get('body').should('contain.text', tournamentName);

      // Step 8: Click on the newly created tournament to view details
      cy.get('.tournamentCard').contains(tournamentName).click();

      // Step 9: Assert navigation to tournament detail page
      cy.url().should('include', '/tournaments/');

      // Step 10: Verify tournament detail view elements
      cy.get('body').should('contain.text', tournamentName);
      cy.get('body').should('contain.text', '8-Ball Pool');
      cy.get('body').should('contain.text', 'Single Elimination');
      cy.get('body').should('contain.text', '50 Dojo Coins');
      cy.get('body').should('contain.text', '16');

      // Step 11: Verify tournament bracket is visible (should be empty initially)
      cy.get('[data-testid=tournament-bracket]').should('be.visible');

      // Step 12: Verify participants section
      cy.get('[data-testid=participants-section]').should('be.visible');
      cy.get('body').should('contain.text', '0 / 16');
    });

    it('should handle tournament creation with different game types', () => {
      // Generate unique test data
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';
      const tournamentName = `9-Ball Championship ${Date.now()}`;

      // Login as venue owner
      cy.register(uniqueEmail, password);
      cy.wait(1000);
      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Navigate to venue dashboard
      cy.visit('/venue/dashboard');
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Create tournament with 9-ball format
      cy.get('button').contains('🏆 Create Tournament').click();

      cy.get('[name=name]').type(tournamentName);
      cy.get('[name=description]').type('Fast-paced 9-ball tournament');
      cy.get('[name=tournamentType]').select('DOUBLE_ELIMINATION');
      cy.get('[name=gameType]').select('9_BALL');
      cy.get('[name=maxParticipants]').clear().type('32');
      cy.get('[name=entryFee]').clear().type('75');

      // Set dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().slice(0, 16);
      cy.get('[name=startDate]').type(startDate);

      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const endDate = dayAfterTomorrow.toISOString().slice(0, 16);
      cy.get('[name=endDate]').type(endDate);

      cy.get('[name=rules]').type(
        '9-ball rules. Lowest numbered ball first. Fast-paced action!'
      );

      // Submit form
      cy.get('button[type=submit]').click();

      // Verify creation
      cy.get('[name=name]').should('not.exist');
      cy.get('body').should('contain.text', tournamentName);

      // View tournament details
      cy.get('.tournamentCard').contains(tournamentName).click();
      cy.url().should('include', '/tournaments/');

      // Verify 9-ball specific details
      cy.get('body').should('contain.text', '9-Ball Pool');
      cy.get('body').should('contain.text', 'Double Elimination');
      cy.get('body').should('contain.text', '75 Dojo Coins');
      cy.get('body').should('contain.text', '32');
    });

    it('should validate required fields in tournament creation form', () => {
      // Generate unique test data
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

      // Login as venue owner
      cy.register(uniqueEmail, password);
      cy.wait(1000);
      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Navigate to venue dashboard
      cy.visit('/venue/dashboard');
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Open create tournament modal
      cy.get('button').contains('🏆 Create Tournament').click();

      // Try to submit empty form
      cy.get('button[type=submit]').click();

      // Verify validation errors
      cy.get('body').should('contain.text', 'Tournament name is required');
      cy.get('body').should('contain.text', 'Start date is required');
      cy.get('body').should('contain.text', 'End date is required');

      // Fill in required fields
      cy.get('[name=name]').type('Valid Tournament Name');
      cy.get('[name=startDate]').type('2024-12-31T10:00');
      cy.get('[name=endDate]').type('2025-01-01T10:00');

      // Submit should now work
      cy.get('button[type=submit]').click();

      // Verify success
      cy.get('[name=name]').should('not.exist');
      cy.get('body').should('contain.text', 'Valid Tournament Name');
    });

    it('should handle tournament creation with free entry fee', () => {
      // Generate unique test data
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';
      const tournamentName = `Free Tournament ${Date.now()}`;

      // Login as venue owner
      cy.register(uniqueEmail, password);
      cy.wait(1000);
      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Navigate to venue dashboard
      cy.visit('/venue/dashboard');
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Create free tournament
      cy.get('button').contains('🏆 Create Tournament').click();

      cy.get('[name=name]').type(tournamentName);
      cy.get('[name=description]').type('Free entry tournament for beginners');
      cy.get('[name=tournamentType]').select('ROUND_ROBIN');
      cy.get('[name=gameType]').select('8_BALL');
      cy.get('[name=maxParticipants]').clear().type('8');
      cy.get('[name=entryFee]').clear().type('0');

      // Set dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().slice(0, 16);
      cy.get('[name=startDate]').type(startDate);

      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const endDate = dayAfterTomorrow.toISOString().slice(0, 16);
      cy.get('[name=endDate]').type(endDate);

      cy.get('[name=rules]').type(
        'Free tournament for new players. Round robin format.'
      );

      // Submit form
      cy.get('button[type=submit]').click();

      // Verify creation
      cy.get('[name=name]').should('not.exist');
      cy.get('body').should('contain.text', tournamentName);

      // View tournament details
      cy.get('.tournamentCard').contains(tournamentName).click();
      cy.url().should('include', '/tournaments/');

      // Verify free tournament details
      cy.get('body').should('contain.text', 'Free Tournament');
      cy.get('body').should('contain.text', 'Round Robin');
      cy.get('body').should('contain.text', '0 Dojo Coins');
      cy.get('body').should('contain.text', '8');
    });
  });

  describe('Tournament Management Dashboard', () => {
    it('should display tournament list and management options', () => {
      // Generate unique test data
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

      // Login as venue owner
      cy.register(uniqueEmail, password);
      cy.wait(1000);
      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Navigate to venue dashboard
      cy.visit('/venue/dashboard');
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Verify tournament management section is visible
      cy.get('h2').contains('Tournament Management').should('be.visible');

      // Verify create tournament button
      cy.get('button').contains('🏆 Create Tournament').should('be.visible');

      // Verify refresh button
      cy.get('button').contains('🔄 Refresh').should('be.visible');

      // Verify tournament info text
      cy.get('body').should(
        'contain.text',
        'Create and manage tournaments for your venue'
      );

      // Verify tournament list container
      cy.get('.tournamentListContainer').should('be.visible');
    });

    it('should handle empty tournament list state', () => {
      // Generate unique test data
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

      // Login as venue owner
      cy.register(uniqueEmail, password);
      cy.wait(1000);
      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Navigate to venue dashboard
      cy.visit('/venue/dashboard');
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Verify empty state message (if implemented)
      // This test assumes the component handles empty states gracefully
      cy.get('.tournamentListContainer').should('be.visible');

      // Create a tournament to verify the list updates
      cy.get('button').contains('🏆 Create Tournament').click();

      const tournamentName = `Empty State Test ${Date.now()}`;
      cy.get('[name=name]').type(tournamentName);
      cy.get('[name=startDate]').type('2024-12-31T10:00');
      cy.get('[name=endDate]').type('2025-01-01T10:00');

      cy.get('button[type=submit]').click();

      // Verify tournament appears in list
      cy.get('body').should('contain.text', tournamentName);
    });
  });
});

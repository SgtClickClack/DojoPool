describe('Tournament Management - Venue Owner Workflow', () => {
  beforeEach(() => {
    // Clear any existing session data
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Complete Tournament Creation Journey', () => {
    it('should successfully create and view a new tournament', () => {
      // Generate unique test data
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';
      const tournamentName = `Test Tournament ${Date.now()}`;

      // Step 1: Register and login as a venue owner
      cy.register(uniqueEmail, password);
      cy.wait(1000); // Wait for registration to complete

      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Step 2: Navigate to Venue Dashboard
      cy.visit('/venue/dashboard');
      cy.get('body').should('be.visible');

      // Wait for venue data to load
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Step 3: Click Create Tournament button
      cy.get('button')
        .contains('🏆 Create Tournament')
        .should('be.visible')
        .click();

      // Step 4: Fill out tournament creation form
      cy.get('[name=name]').should('be.visible').type(tournamentName);
      cy.get('[name=description]').type('A test tournament for E2E testing');

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
        'Standard 8-ball rules apply. No coaching allowed.'
      );

      // Step 5: Submit the form
      cy.get('button[type=submit]').should('be.enabled').click();

      // Step 6: Verify tournament creation success
      // The modal should close and we should be back on the dashboard
      cy.get('[name=name]').should('not.exist'); // Form should not be visible

      // Step 7: Verify new tournament appears in the list
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

    it('should handle tournament creation validation errors', () => {
      // Login as venue owner
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

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

      // Test empty form submission
      cy.get('button[type=submit]').click();
      cy.get('body').should('contain.text', 'required');

      // Test invalid dates (end date before start date)
      cy.get('[name=name]').type('Invalid Date Tournament');
      cy.get('[name=startDate]').type('2024-12-31T10:00');
      cy.get('[name=endDate]').type('2024-12-30T10:00');
      cy.get('button[type=submit]').click();
      cy.get('body').should(
        'contain.text',
        'End date must be after start date'
      );

      // Test invalid participant count
      cy.get('[name=maxParticipants]').clear().type('1');
      cy.get('button[type=submit]').click();
      cy.get('body').should('contain.text', 'Minimum 2 participants required');

      // Test negative entry fee
      cy.get('[name=entryFee]').clear().type('-10');
      cy.get('button[type=submit]').click();
      cy.get('body').should('contain.text', 'Entry fee cannot be negative');
    });

    it('should display tournament information correctly in the list', () => {
      // Login as venue owner
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

      cy.register(uniqueEmail, password);
      cy.wait(1000);
      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Navigate to venue dashboard
      cy.visit('/venue/dashboard');
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Create a tournament first
      const tournamentName = `Display Test Tournament ${Date.now()}`;

      cy.get('button').contains('🏆 Create Tournament').click();

      // Fill form with specific data for testing display
      cy.get('[name=name]').type(tournamentName);
      cy.get('[name=description]').type('Tournament for display testing');
      cy.get('[name=tournamentType]').select('DOUBLE_ELIMINATION');
      cy.get('[name=gameType]').select('9_BALL');
      cy.get('[name=maxParticipants]').clear().type('32');
      cy.get('[name=entryFee]').clear().type('100');

      // Set dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().slice(0, 16);
      cy.get('[name=startDate]').type(startDate);

      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const endDate = dayAfterTomorrow.toISOString().slice(0, 16);
      cy.get('[name=endDate]').type(endDate);

      cy.get('button[type=submit]').click();

      // Wait for form to close and tournament to appear
      cy.get('[name=name]').should('not.exist');
      cy.get('body').should('contain.text', tournamentName);

      // Verify tournament card displays all information correctly
      cy.get('.tournamentCard')
        .contains(tournamentName)
        .parent()
        .within(() => {
          // Check tournament type
          cy.get('body').should('contain.text', 'Double Elimination');

          // Check game type
          cy.get('body').should('contain.text', '9-Ball');

          // Check participant count
          cy.get('body').should('contain.text', '0 / 32');

          // Check entry fee
          cy.get('body').should('contain.text', '100 Dojo Coins');

          // Check status (should be REGISTRATION)
          cy.get('body').should('contain.text', 'REGISTRATION');

          // Check progress bar (should be 0%)
          cy.get('body').should('contain.text', '0% Full');
        });
    });

    it('should navigate between tournament list and detail views', () => {
      // Login as venue owner
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

      cy.register(uniqueEmail, password);
      cy.wait(1000);
      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Navigate to venue dashboard
      cy.visit('/venue/dashboard');
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Create a tournament for navigation testing
      const tournamentName = `Navigation Test Tournament ${Date.now()}`;

      cy.get('button').contains('🏆 Create Tournament').click();

      // Fill minimal required fields
      cy.get('[name=name]').type(tournamentName);
      cy.get('[name=startDate]').type('2024-12-31T10:00');
      cy.get('[name=endDate]').type('2025-01-01T10:00');

      cy.get('button[type=submit]').click();

      // Wait for tournament to appear in list
      cy.get('body').should('contain.text', tournamentName);

      // Test navigation to tournament detail
      cy.get('.tournamentCard').contains(tournamentName).click();
      cy.url().should('include', '/tournaments/');
      cy.get('body').should('contain.text', tournamentName);

      // Test navigation back to venue dashboard
      cy.go('back');
      cy.url().should('include', '/venue/dashboard');
      cy.get('body').should('contain.text', tournamentName);

      // Test direct navigation to tournament detail
      cy.get('.tournamentCard').contains(tournamentName).click();
      cy.url().should('include', '/tournaments/');

      // Verify we can navigate to tournament detail page directly
      cy.visit('/venue/dashboard');
      cy.get('.tournamentCard').contains(tournamentName).click();
      cy.url().should('include', '/tournaments/');
    });
  });

  describe('Tournament Management Features', () => {
    it('should refresh tournament list and show updated data', () => {
      // Login as venue owner
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

      cy.register(uniqueEmail, password);
      cy.wait(1000);
      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Navigate to venue dashboard
      cy.visit('/venue/dashboard');
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Click refresh button
      cy.get('button').contains('🔄 Refresh').click();

      // Verify refresh functionality works
      cy.get('body').should('not.contain.text', 'Loading tournaments...');

      // Create a tournament to test refresh
      const tournamentName = `Refresh Test Tournament ${Date.now()}`;

      cy.get('button').contains('🏆 Create Tournament').click();
      cy.get('[name=name]').type(tournamentName);
      cy.get('[name=startDate]').type('2024-12-31T10:00');
      cy.get('[name=endDate]').type('2025-01-01T10:00');
      cy.get('button[type=submit]').click();

      // Verify tournament appears
      cy.get('body').should('contain.text', tournamentName);

      // Click refresh again
      cy.get('button').contains('🔄 Refresh').click();

      // Tournament should still be visible after refresh
      cy.get('body').should('contain.text', tournamentName);
    });

    it('should handle empty tournament state gracefully', () => {
      // Login as venue owner
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

      cy.register(uniqueEmail, password);
      cy.wait(1000);
      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Navigate to venue dashboard
      cy.visit('/venue/dashboard');
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // If no tournaments exist, should show empty state
      cy.get('body').should('contain.text', 'No Tournaments Yet');
      cy.get('body').should(
        'contain.text',
        'Create your first tournament to get started!'
      );

      // Empty state should have create tournament button
      cy.get('button').contains('🏆 Create Tournament').should('be.visible');
    });
  });

  describe('Form Accessibility and UX', () => {
    it('should have proper form validation and user feedback', () => {
      // Login as venue owner
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

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

      // Test form field accessibility
      cy.get('[name=name]').should('have.attr', 'type', 'text');
      cy.get('[name=tournamentType]').should('be.visible');
      cy.get('[name=gameType]').should('be.visible');
      cy.get('[name=maxParticipants]').should('have.attr', 'type', 'number');
      cy.get('[name=entryFee]').should('have.attr', 'type', 'number');
      cy.get('[name=startDate]').should('have.attr', 'type', 'datetime-local');
      cy.get('[name=endDate]').should('have.attr', 'type', 'datetime-local');

      // Test submit button state
      cy.get('button[type=submit]').should('be.visible').and('be.enabled');

      // Test cancel button functionality
      cy.get('button').contains('Cancel').click();
      cy.get('[name=name]').should('not.exist'); // Form should close
    });

    it('should handle keyboard navigation in tournament creation form', () => {
      // Login as venue owner
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

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

      // Test tab navigation through form fields
      cy.get('body').tab();
      cy.focused().should('have.attr', 'name', 'name');

      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'tournamentType');

      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'gameType');

      // Continue tabbing through other fields
      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'maxParticipants');

      // Test that submit button is reachable
      cy.get('button[type=submit]').focus();
      cy.focused().should('have.attr', 'type', 'submit');
    });
  });
});

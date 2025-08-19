describe('Tournament Management - Simplified E2E Test', () => {
  beforeEach(() => {
    // Clear any existing session data
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Basic Tournament Creation Flow', () => {
    it('should create and view a tournament using helper commands', () => {
      // Generate unique test data
      const uniqueEmail = cy.generateUniqueEmail();
      const password = 'SecurePassword123!';

      // Step 1: Register and login as a venue owner
      cy.register(uniqueEmail, password);
      cy.wait(1000);

      cy.login(uniqueEmail, password);
      cy.isAuthenticated();

      // Step 2: Navigate to Venue Dashboard
      cy.visit('/venue/dashboard');
      cy.get('body').should('be.visible');

      // Wait for venue data to load
      cy.get('[data-testid=venue-dashboard]', { timeout: 10000 }).should(
        'be.visible'
      );

      // Step 3: Create tournament using helper command
      const tournamentData = cy.createTournament('basic');

      // Step 4: Verify tournament creation success
      cy.get('[name=name]').should('not.exist'); // Form should close
      cy.get('body').should('contain.text', tournamentData.name);

      // Step 5: Click on the tournament to view details
      cy.get('.tournamentCard').contains(tournamentData.name).click();

      // Step 6: Verify navigation to tournament detail page
      cy.url().should('include', '/tournaments/');
      cy.get('body').should('contain.text', tournamentData.name);

      // Step 7: Verify key tournament information
      cy.get('body').should('contain.text', '8-Ball Pool');
      cy.get('body').should('contain.text', 'Single Elimination');
      cy.get('body').should('contain.text', '25 Dojo Coins');
      cy.get('body').should('contain.text', '16');
    });

    it('should create different tournament types using scenarios', () => {
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

      // Test premium tournament scenario
      const premiumTournament = cy.createTournament('premium');
      cy.get('body').should('contain.text', premiumTournament.name);
      cy.get('body').should('contain.text', '9-Ball');
      cy.get('body').should('contain.text', 'Double Elimination');
      cy.get('body').should('contain.text', '150 Dojo Coins');

      // Test free tournament scenario
      const freeTournament = cy.createTournament('free');
      cy.get('body').should('contain.text', freeTournament.name);
      cy.get('body').should('contain.text', 'Round Robin');
      cy.get('body').should('contain.text', '0 Dojo Coins');
    });
  });

  describe('Tournament Form Validation', () => {
    it('should validate required fields and show appropriate errors', () => {
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

      // Test with invalid data
      cy.get('[name=name]').type('Test Tournament');
      cy.get('[name=startDate]').type('2024-12-31T10:00');
      cy.get('[name=endDate]').type('2024-12-30T10:00'); // End before start
      cy.get('button[type=submit]').click();
      cy.get('body').should(
        'contain.text',
        'End date must be after start date'
      );
    });
  });

  describe('Tournament Navigation and Display', () => {
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
      const tournamentData = cy.createTournament('basic');

      // Test navigation to tournament detail
      cy.get('.tournamentCard').contains(tournamentData.name).click();
      cy.url().should('include', '/tournaments/');
      cy.get('body').should('contain.text', tournamentData.name);

      // Test navigation back to venue dashboard
      cy.go('back');
      cy.url().should('include', '/venue/dashboard');
      cy.get('body').should('contain.text', tournamentData.name);
    });
  });
});

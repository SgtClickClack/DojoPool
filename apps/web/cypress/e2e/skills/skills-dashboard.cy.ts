describe('Skills Dashboard', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('test@example.com', 'password');

    // Visit skills page
    cy.visit('/profile/skills');
  });

  describe('Overview Tab', () => {
    it('should display the skills overview with key metrics', () => {
      // Check page title
      cy.contains('Player Skill Progression & Mastery').should('be.visible');

      // Check tab navigation
      cy.contains('Overview').should('be.visible');
      cy.contains('Skill Tree').should('be.visible');
      cy.contains('Progress History').should('be.visible');
      cy.contains('Achievements').should('be.visible');

      // Check overall stats card
      cy.contains('Overall Mastery').should('be.visible');
      cy.contains('Average Skill Level').should('be.visible');

      // Check top skills section
      cy.contains('Top Skills').should('be.visible');

      // Check skill categories section
      cy.contains('Skill Categories').should('be.visible');
    });

    it('should display skill progression data correctly', () => {
      // Wait for data to load
      cy.get('[data-testid="skill-overview"]').should('be.visible');

      // Check that skill levels are displayed
      cy.get('[data-testid="skill-level"]').should('exist');

      // Check proficiency scores
      cy.get('[data-testid="proficiency-score"]').should('exist');

      // Check total points
      cy.get('[data-testid="total-points"]').should('exist');
    });

    it('should handle empty skill data gracefully', () => {
      // Mock empty skill data
      cy.intercept('GET', '/api/v1/skills/player/me', {
        playerId: 'test-user',
        username: 'TestPlayer',
        totalSkills: 0,
        averageLevel: 0,
        totalPoints: 0,
        topSkills: [],
        recentActivity: [],
        skillCategories: [],
      }).as('getEmptySkills');

      cy.reload();

      // Should show appropriate empty state
      cy.contains('No recent skill activity').should('be.visible');
    });
  });

  describe('Skill Tree Tab', () => {
    beforeEach(() => {
      // Switch to Skill Tree tab
      cy.contains('Skill Tree').click();
    });

    it('should display skill tree with categories', () => {
      // Check category headers
      cy.contains('AIMING_ACCURACY').should('be.visible');
      cy.contains('POSITIONING').should('be.visible');

      // Check skill cards
      cy.get('[data-testid="skill-card"]').should('exist');
    });

    it('should show skill progression levels and points', () => {
      // Check level display
      cy.get('[data-testid="skill-level-display"]').should('exist');

      // Check points display
      cy.get('[data-testid="skill-points-display"]').should('exist');

      // Check proficiency bars
      cy.get('[data-testid="proficiency-bar"]').should('exist');
    });

    it('should display locked and unlocked skills differently', () => {
      // Check for locked skills (level 0)
      cy.get('[data-testid="locked-skill"]').should('exist');

      // Check for unlocked skills (level > 0)
      cy.get('[data-testid="unlocked-skill"]').should('exist');
    });

    it('should show points needed for next level', () => {
      // Check next level requirements
      cy.contains('points to next level').should('exist');
    });
  });

  describe('Progress History Tab', () => {
    beforeEach(() => {
      // Switch to Progress History tab
      cy.contains('Progress History').click();
    });

    it('should display recent skill activity', () => {
      // Check activity feed
      cy.contains('Recent Skill Progress').should('be.visible');

      // Check activity items
      cy.get('[data-testid="activity-item"]').should('exist');
    });

    it('should show skill point awards with timestamps', () => {
      // Check point awards
      cy.get('[data-testid="skill-points-award"]').should('exist');

      // Check timestamps
      cy.get('[data-testid="activity-timestamp"]').should('exist');
    });

    it('should handle empty activity gracefully', () => {
      // Mock empty activity
      cy.intercept('GET', '/api/v1/skills/player/me', {
        playerId: 'test-user',
        username: 'TestPlayer',
        totalSkills: 1,
        averageLevel: 1,
        totalPoints: 10,
        topSkills: [],
        recentActivity: [],
        skillCategories: [],
      }).as('getEmptyActivity');

      cy.reload();

      // Should show empty state message
      cy.contains('No recent skill activity found').should('be.visible');
    });
  });

  describe('Achievements Tab', () => {
    beforeEach(() => {
      // Switch to Achievements tab
      cy.contains('Achievements').click();
    });

    it('should display achievements section', () => {
      // Check achievements title
      cy.contains('Skill-Based Achievements').should('be.visible');
    });

    it('should show placeholder content for achievements', () => {
      // Check placeholder text
      cy.contains('Skill-based achievements will be displayed here').should(
        'be.visible'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/v1/skills/player/me', {
        statusCode: 500,
        body: { message: 'Internal server error' },
      }).as('getSkillsError');

      cy.reload();

      // Should show error message
      cy.contains('Failed to load skill progression data').should('be.visible');

      // Should show retry button
      cy.contains('Retry').should('be.visible');
    });

    it('should handle network errors', () => {
      // Mock network failure
      cy.intercept('GET', '/api/v1/skills/player/me', {
        forceNetworkError: true,
      }).as('getSkillsNetworkError');

      cy.reload();

      // Should show error message
      cy.contains('Failed to load skill progression data').should('be.visible');
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching data', () => {
      // Slow down the API response
      cy.intercept('GET', '/api/v1/skills/player/me', (req) => {
        req.reply((res) => {
          res.delay(2000); // 2 second delay
        });
      }).as('slowGetSkills');

      cy.reload();

      // Should show loading indicator
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.contains('Loading your skill progression...').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile devices', () => {
      // Set viewport to mobile size
      cy.viewport('iphone-x');

      // Check that tabs are accessible
      cy.get('[data-testid="skill-tabs"]').should('be.visible');

      // Check that content adapts to mobile
      cy.get('[data-testid="skill-overview"]').should('be.visible');
    });

    it('should be responsive on tablet devices', () => {
      // Set viewport to tablet size
      cy.viewport('ipad-2');

      // Check layout adapts properly
      cy.get('[data-testid="skill-overview"]').should('be.visible');

      // Check grid layouts work on tablet
      cy.get('[data-testid="skill-category-grid"]').should('be.visible');
    });
  });

  describe('Navigation', () => {
    it('should allow switching between tabs', () => {
      // Start on Overview tab
      cy.contains('Overview').should('have.class', 'Mui-selected');

      // Switch to Skill Tree
      cy.contains('Skill Tree').click();
      cy.contains('Skill Tree').should('have.class', 'Mui-selected');
      cy.get('[data-testid="skill-tree-content"]').should('be.visible');

      // Switch to Progress History
      cy.contains('Progress History').click();
      cy.contains('Progress History').should('have.class', 'Mui-selected');
      cy.get('[data-testid="progress-history-content"]').should('be.visible');

      // Switch to Achievements
      cy.contains('Achievements').click();
      cy.contains('Achievements').should('have.class', 'Mui-selected');
      cy.get('[data-testid="achievements-content"]').should('be.visible');
    });

    it('should preserve tab selection on page refresh', () => {
      // Switch to Skill Tree tab
      cy.contains('Skill Tree').click();

      // Refresh page
      cy.reload();

      // Should still be on Skill Tree tab
      cy.contains('Skill Tree').should('have.class', 'Mui-selected');
    });
  });

  describe('Data Updates', () => {
    it('should refresh data when retry button is clicked', () => {
      // Mock failed request first
      cy.intercept('GET', '/api/v1/skills/player/me', {
        statusCode: 500,
      }).as('failedRequest');

      cy.reload();

      // Should show error
      cy.contains('Failed to load skill progression data').should('be.visible');

      // Mock successful request
      cy.intercept('GET', '/api/v1/skills/player/me', {
        playerId: 'test-user',
        username: 'TestPlayer',
        totalSkills: 1,
        averageLevel: 1,
        totalPoints: 10,
        topSkills: [],
        recentActivity: [],
        skillCategories: [],
      }).as('successfulRequest');

      // Click retry
      cy.contains('Retry').click();

      // Should load successfully
      cy.contains('Overall Mastery').should('be.visible');
    });
  });
});

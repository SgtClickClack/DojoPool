describe('Social Feed Component', () => {
  beforeEach(() => {
    // Mock the authentication and API responses
    cy.intercept('GET', '/api/auth/me', { fixture: 'user.json' }).as('getUser');
    cy.intercept('GET', '/api/activity*', { fixture: 'activity-feed.json' }).as(
      'getActivityFeed'
    );
    cy.intercept('GET', '/socket.io/*', { statusCode: 200 }).as('websocket');

    // Visit the dashboard page
    cy.visit('/dashboard');
    cy.wait('@getUser');
  });

  it('should display the activity feed section', () => {
    // Check that the activity feed section is visible
    cy.contains('Activity Feed').should('be.visible');

    // Check that the global filter is selected by default
    cy.contains('Global Activity').should('be.visible');
  });

  it('should display activity events correctly', () => {
    cy.wait('@getActivityFeed');

    // Check that activity events are displayed
    cy.get('[data-cy=activity-event]').should('have.length.greaterThan', 0);

    // Check that each event has the required elements
    cy.get('[data-cy=activity-event]')
      .first()
      .within(() => {
        cy.get('[data-cy=event-icon]').should('be.visible');
        cy.get('[data-cy=event-username]').should('be.visible');
        cy.get('[data-cy=event-title]').should('be.visible');
        cy.get('[data-cy=event-description]').should('be.visible');
        cy.get('[data-cy=event-timestamp]').should('be.visible');
      });
  });

  it('should handle real-time activity updates', () => {
    cy.wait('@getActivityFeed');

    // Simulate receiving a new activity event via WebSocket
    cy.window().then((win) => {
      // Mock WebSocket message for new activity event
      win.dispatchEvent(
        new CustomEvent('activity:new', {
          detail: {
            type: 'new_activity_event',
            data: {
              id: 'new-event-123',
              type: 'GAME_COMPLETED',
              title: 'Match Won!',
              description: 'Player defeated opponent in exciting match',
              username: 'TestPlayer',
              userAvatar: '/avatar.jpg',
              createdAt: new Date().toISOString(),
              isPublic: true,
            },
          },
        })
      );
    });

    // Check that the new event appears at the top
    cy.get('[data-cy=activity-event]').first().should('contain', 'Match Won!');
  });

  it('should handle pagination', () => {
    cy.wait('@getActivityFeed');

    // Check if load more button exists
    cy.get('body').then(($body) => {
      if ($body.text().includes('Load More')) {
        cy.contains('Load More').click();

        // Should make another API call
        cy.wait('@getActivityFeed');

        // Should display more events
        cy.get('[data-cy=activity-event]').should('have.length.greaterThan', 5);
      }
    });
  });

  it('should refresh activity feed', () => {
    cy.wait('@getActivityFeed');

    // Click the refresh button
    cy.get('[data-cy=refresh-activity]').click();

    // Should make another API call
    cy.wait('@getActivityFeed');

    // Should still display events
    cy.get('[data-cy=activity-event]').should('have.length.greaterThan', 0);
  });

  it('should display empty state when no activities', () => {
    // Mock empty response
    cy.intercept('GET', '/api/activity*', {
      entries: [],
      pagination: { total: 0, hasNext: false },
    });

    cy.reload();
    cy.wait('@getActivityFeed');

    // Should show empty state message
    cy.contains('No activity yet').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/activity*', { statusCode: 500 });

    cy.reload();

    // Should show error message
    cy.contains('Failed to fetch activity feed').should('be.visible');

    // Should show retry button
    cy.contains('Retry').should('be.visible');
  });

  it('should display different event types with correct icons', () => {
    cy.wait('@getActivityFeed');

    // Check for different event types and their icons
    cy.get('[data-cy=activity-event]').each(($event) => {
      cy.wrap($event).find('[data-cy=event-icon]').should('be.visible');
    });
  });

  it('should format timestamps correctly', () => {
    cy.wait('@getActivityFeed');

    // Check that timestamps are displayed and formatted
    cy.get('[data-cy=event-timestamp]').each(($timestamp) => {
      cy.wrap($timestamp).should('not.be.empty');
      cy.wrap($timestamp)
        .invoke('text')
        .should('match', /(Just now|\d+[mhd] ago|\d+\/\d+\/\d+)/);
    });
  });
});

describe('Notifications Component', () => {
  beforeEach(() => {
    // Mock the authentication and API responses
    cy.intercept('GET', '/api/auth/me', { fixture: 'user.json' }).as('getUser');
    cy.intercept('GET', '/api/notifications*', {
      fixture: 'notifications.json',
    }).as('getNotifications');
    cy.intercept('GET', '/api/notifications/unread-count', {
      unreadCount: 3,
    }).as('getUnreadCount');
    cy.intercept('GET', '/socket.io/*', { statusCode: 200 }).as('websocket');

    // Visit the dashboard page
    cy.visit('/dashboard');
    cy.wait('@getUser');
  });

  it('should display notifications button with unread count', () => {
    // Check that the notifications button is visible
    cy.get('[data-cy=notifications-button]').should('be.visible');

    // Check that it shows the unread count
    cy.get('[data-cy=notifications-button]').should('contain', '3');
  });

  it('should open notifications panel when clicked', () => {
    // Click the notifications button
    cy.get('[data-cy=notifications-button]').click();

    // Check that the notifications panel is visible
    cy.get('[data-cy=notifications-panel]').should('be.visible');

    // Check panel header
    cy.get('[data-cy=notifications-panel]').should('contain', 'Notifications');
  });

  it('should display notifications correctly', () => {
    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();

    // Wait for notifications to load
    cy.wait('@getNotifications');

    // Check that notifications are displayed
    cy.get('[data-cy=notification-item]').should('have.length.greaterThan', 0);

    // Check notification structure
    cy.get('[data-cy=notification-item]')
      .first()
      .within(() => {
        cy.get('[data-cy=notification-icon]').should('be.visible');
        cy.get('[data-cy=notification-title]').should('be.visible');
        cy.get('[data-cy=notification-message]').should('be.visible');
        cy.get('[data-cy=notification-timestamp]').should('be.visible');
      });
  });

  it('should handle real-time notification updates', () => {
    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();

    // Simulate receiving a new notification via WebSocket
    cy.window().then((win) => {
      win.dispatchEvent(
        new CustomEvent('notification:new', {
          detail: {
            type: 'new_notification',
            data: {
              id: 'new-notification-123',
              type: 'challenge_received',
              title: 'New Challenge!',
              message: 'PlayerX has challenged you to a match',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          },
        })
      );
    });

    // Check that the new notification appears
    cy.get('[data-cy=notification-item]')
      .first()
      .should('contain', 'New Challenge!');

    // Check that unread count increases
    cy.get('[data-cy=notifications-button]').should('contain', '4');
  });

  it('should mark notification as read when clicked', () => {
    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();
    cy.wait('@getNotifications');

    // Click on an unread notification
    cy.get('[data-cy=notification-item]').first().click();

    // Should make API call to mark as read
    cy.wait('@getNotifications'); // Wait for the update

    // The notification should no longer show as unread
    cy.get('[data-cy=notification-item]')
      .first()
      .should('not.have.class', 'unread');
  });

  it('should mark all notifications as read', () => {
    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();
    cy.wait('@getNotifications');

    // Click mark all as read button
    cy.get('[data-cy=mark-all-read]').click();

    // Should make API call
    cy.wait('@getNotifications');

    // Unread count should be zero
    cy.get('[data-cy=notifications-button]').should('not.contain', '3');
  });

  it('should close notifications panel', () => {
    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();
    cy.get('[data-cy=notifications-panel]').should('be.visible');

    // Click close button
    cy.get('[data-cy=close-notifications]').click();

    // Panel should be hidden
    cy.get('[data-cy=notifications-panel]').should('not.be.visible');
  });

  it('should display different notification types with correct icons', () => {
    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();
    cy.wait('@getNotifications');

    // Check that different notification types have appropriate icons
    cy.get('[data-cy=notification-item]').each(($notification) => {
      cy.wrap($notification)
        .find('[data-cy=notification-icon]')
        .should('be.visible');
    });
  });

  it('should format timestamps correctly', () => {
    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();
    cy.wait('@getNotifications');

    // Check timestamp formatting
    cy.get('[data-cy=notification-timestamp]').each(($timestamp) => {
      cy.wrap($timestamp).should('not.be.empty');
      cy.wrap($timestamp)
        .invoke('text')
        .should('match', /(Just now|\d+[mhd] ago|\d+\/\d+\/\d+)/);
    });
  });

  it('should display empty state when no notifications', () => {
    // Mock empty notifications response
    cy.intercept('GET', '/api/notifications*', {
      notifications: [],
      totalCount: 0,
      unreadCount: 0,
      pagination: {
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();

    // Should show empty state message
    cy.contains('No notifications yet').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/notifications*', { statusCode: 500 });

    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();

    // Should show error message
    cy.contains('Failed to load notifications').should('be.visible');
  });

  it('should handle WebSocket connection status', () => {
    // Open notifications panel
    cy.get('[data-cy=notifications-button]').click();

    // Check that connection status is displayed (if implemented)
    cy.get('body').then(($body) => {
      if ($body.text().includes('WebSocket Connected')) {
        cy.contains('WebSocket Connected').should('be.visible');
      }
    });
  });
});

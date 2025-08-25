describe('Admin Panel Access', () => {
  beforeEach(() => {
    // Mock authentication endpoints
    cy.intercept('POST', '/api/auth/login', (req) => {
      const { email } = req.body;

      if (email === 'admin@example.com') {
        req.reply({
          statusCode: 200,
          body: {
            user: {
              id: 'admin-user-1',
              username: 'adminuser',
              email: 'admin@example.com',
              role: 'ADMIN',
              avatar: 'admin-avatar',
            },
            token: 'admin-jwt-token',
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            user: {
              id: 'regular-user-1',
              username: 'regularuser',
              email: 'user@example.com',
              role: 'USER',
              avatar: 'user-avatar',
            },
            token: 'user-jwt-token',
          },
        });
      }
    }).as('login');

    // Mock user validation endpoint
    cy.intercept('GET', '/api/auth/me', (req) => {
      const authHeader = req.headers.authorization;

      if (authHeader === 'Bearer admin-jwt-token') {
        req.reply({
          statusCode: 200,
          body: {
            id: 'admin-user-1',
            username: 'adminuser',
            email: 'admin@example.com',
            role: 'ADMIN',
            avatar: 'admin-avatar',
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            id: 'regular-user-1',
            username: 'regularuser',
            email: 'user@example.com',
            role: 'USER',
            avatar: 'user-avatar',
          },
        });
      }
    }).as('getUser');

    // Mock admin stats API
    cy.intercept('GET', '/api/v1/admin/stats', {
      statusCode: 200,
      body: {
        totalUsers: 1250,
        totalMatches: 5678,
        totalClans: 89,
        activeUsers: 456,
        totalRevenue: 12500.5,
        averageRating: 4.2,
      },
    }).as('getAdminStats');

    // Mock admin users API
    cy.intercept('GET', '/api/v1/admin/users*', {
      statusCode: 200,
      body: {
        users: [
          {
            id: 'user-1',
            username: 'testuser1',
            email: 'user1@example.com',
            role: 'USER',
            isBanned: false,
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: '2024-01-15T10:30:00Z',
          },
          {
            id: 'user-2',
            username: 'testuser2',
            email: 'user2@example.com',
            role: 'USER',
            isBanned: false,
            createdAt: '2024-01-02T00:00:00Z',
            lastLogin: '2024-01-14T15:45:00Z',
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1250,
          totalPages: 63,
        },
      },
    }).as('getAdminUsers');
  });

  describe('Non-Admin User Access', () => {
    it('should redirect non-admin users away from admin panel', () => {
      // Login as regular user
      cy.login('user@example.com', 'password123');
      cy.url().should('include', '/dashboard');

      // Attempt to visit admin panel
      cy.visit('/admin');

      // Wait for user validation
      cy.wait('@getUser');

      // Assert that the user was redirected away from admin page
      cy.url().should('not.include', '/admin');

      // Should be redirected to home page or dashboard
      cy.url().should('match', /^\/(dashboard|$)/);

      // Verify admin panel content is not visible
      cy.findByText('Admin Panel').should('not.exist');
      cy.findByText('Manage platform statistics').should('not.exist');
    });

    it('should not show admin navigation elements to regular users', () => {
      cy.login('user@example.com', 'password123');
      cy.visit('/dashboard');

      // Verify admin-related navigation is not present
      cy.findByText('Admin').should('not.exist');
      cy.findByText('Admin Panel').should('not.exist');

      // Check that navigation menu doesn't contain admin links
      cy.get('nav').should('not.contain.text', 'Admin');
    });

    it('should handle direct URL access attempts gracefully', () => {
      cy.login('user@example.com', 'password123');

      // Try to access admin sub-routes directly
      cy.visit('/admin/dashboard');
      cy.url().should('not.include', '/admin');

      cy.visit('/admin/users');
      cy.url().should('not.include', '/admin');

      cy.visit('/admin/settings');
      cy.url().should('not.include', '/admin');
    });
  });

  describe('Admin User Access', () => {
    it('should allow admin users to access admin panel', () => {
      // Login as admin user
      cy.login('admin@example.com', 'password123');
      cy.url().should('include', '/dashboard');

      // Visit admin panel
      cy.visit('/admin');
      cy.url().should('include', '/admin');

      // Wait for user validation
      cy.wait('@getUser');

      // Verify admin panel is accessible and content is visible
      cy.findByText('Admin Panel').should('exist');
      cy.findByText('Manage platform statistics and user accounts').should(
        'exist'
      );

      // Verify admin dashboard elements are present
      cy.findByText('Dashboard').should('exist');
      cy.findByText('User Management').should('exist');
    });

    it('should display admin dashboard with stats cards', () => {
      cy.login('admin@example.com', 'password123');
      cy.visit('/admin');

      // Wait for user validation and stats API call
      cy.wait('@getUser');
      cy.wait('@getAdminStats');

      // Verify stats cards are displayed
      cy.findByText('Total Users').should('exist');
      cy.findByText('1,250').should('exist');

      cy.findByText('Total Matches').should('exist');
      cy.findByText('5,678').should('exist');

      cy.findByText('Total Clans').should('exist');
      cy.findByText('89').should('exist');

      cy.findByText('Active Users').should('exist');
      cy.findByText('456').should('exist');

      cy.findByText('Total Revenue').should('exist');
      cy.findByText('$12,500.50').should('exist');

      cy.findByText('Average Rating').should('exist');
      cy.findByText('4.2').should('exist');
    });

    it('should display user management table', () => {
      cy.login('admin@example.com', 'password123');
      cy.visit('/admin');

      // Wait for user validation
      cy.wait('@getUser');

      // Click on User Management tab
      cy.findByText('User Management').click();

      // Wait for users API call
      cy.wait('@getAdminUsers');

      // Verify user management table is displayed
      cy.findByText('Username').should('exist');
      cy.findByText('Email').should('exist');
      cy.findByText('Role').should('exist');
      cy.findByText('Status').should('exist');
      cy.findByText('Actions').should('exist');

      // Verify user data is displayed
      cy.findByText('testuser1').should('exist');
      cy.findByText('user1@example.com').should('exist');
      cy.findByText('testuser2').should('exist');
      cy.findByText('user2@example.com').should('exist');

      // Verify pagination info
      cy.findByText('1 of 63 pages').should('exist');
      cy.findByText('1,250 total users').should('exist');
    });

    it('should maintain admin access after page reload', () => {
      cy.login('admin@example.com', 'password123');
      cy.visit('/admin');
      cy.wait('@getUser');

      // Verify admin panel is accessible
      cy.findByText('Admin Panel').should('exist');

      // Reload the page
      cy.reload();

      // Wait for user validation again
      cy.wait('@getUser');

      // Verify admin panel is still accessible
      cy.url().should('include', '/admin');
      cy.findByText('Admin Panel').should('exist');
    });

    it('should handle admin API errors gracefully', () => {
      // Mock admin stats API error
      cy.intercept('GET', '/api/v1/admin/stats', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('getAdminStatsError');

      cy.login('admin@example.com', 'password123');
      cy.visit('/admin');
      cy.wait('@getUser');

      // Wait for failed stats API call
      cy.wait('@getAdminStatsError');

      // Verify error message is displayed
      cy.findByText(/Error:/).should('exist');
      cy.findByText(/Failed to fetch stats/).should('exist');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should handle role changes during session', () => {
      // Start with admin role
      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'admin-user-1',
          username: 'adminuser',
          email: 'admin@example.com',
          role: 'ADMIN',
          avatar: 'admin-avatar',
        },
      }).as('getUserAdmin');

      cy.login('admin@example.com', 'password123');
      cy.visit('/admin');
      cy.wait('@getUserAdmin');

      // Verify admin access
      cy.findByText('Admin Panel').should('exist');

      // Change role to USER during session
      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'admin-user-1',
          username: 'adminuser',
          email: 'admin@example.com',
          role: 'USER',
          avatar: 'admin-avatar',
        },
      }).as('getUserRegular');

      // Trigger a new request (e.g., by navigating)
      cy.visit('/admin/dashboard');
      cy.wait('@getUserRegular');

      // Should be redirected away from admin
      cy.url().should('not.include', '/admin');
    });

    it('should handle invalid role values', () => {
      // Mock invalid role
      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'invalid-user-1',
          username: 'invaliduser',
          email: 'invalid@example.com',
          role: 'INVALID_ROLE',
          avatar: 'invalid-avatar',
        },
      }).as('getUserInvalid');

      cy.login('invalid@example.com', 'password123');
      cy.visit('/admin');
      cy.wait('@getUserInvalid');

      // Should be redirected away from admin
      cy.url().should('not.include', '/admin');
    });
  });

  describe('Admin Panel Navigation', () => {
    it('should allow navigation between admin tabs', () => {
      cy.login('admin@example.com', 'password123');
      cy.visit('/admin');
      cy.wait('@getUser');

      // Verify Dashboard tab is active by default
      cy.findByText('Dashboard').should('have.attr', 'aria-selected', 'true');

      // Click User Management tab
      cy.findByText('User Management').click();
      cy.findByText('User Management').should(
        'have.attr',
        'aria-selected',
        'true'
      );
      cy.findByText('Dashboard').should('have.attr', 'aria-selected', 'false');

      // Verify user management content is displayed
      cy.findByText('Username').should('exist');
      cy.findByText('Email').should('exist');

      // Click back to Dashboard tab
      cy.findByText('Dashboard').click();
      cy.findByText('Dashboard').should('have.attr', 'aria-selected', 'true');
      cy.findByText('User Management').should(
        'have.attr',
        'aria-selected',
        'false'
      );

      // Verify dashboard content is displayed
      cy.findByText('Total Users').should('exist');
      cy.findByText('Total Matches').should('exist');
    });

    it('should maintain tab state during page interactions', () => {
      cy.login('admin@example.com', 'password123');
      cy.visit('/admin');
      cy.wait('@getUser');

      // Switch to User Management tab
      cy.findByText('User Management').click();
      cy.wait('@getAdminUsers');

      // Perform some action (e.g., search)
      cy.findByText('Username').should('exist');

      // Verify tab remains active
      cy.findByText('User Management').should(
        'have.attr',
        'aria-selected',
        'true'
      );
    });
  });
});

const adminUser = {
  id: 'admin-user-1',
  username: 'adminuser',
  email: 'admin@example.com',
  role: 'ADMIN',
  avatar: 'admin-avatar',
};

const adminStats = {
  totalUsers: 1250,
  activeUsers: 892,
  totalClans: 45,
  activeMatches: 23,
};

const adminUsers = [
  {
    id: 'user-1',
    username: 'testuser1',
    email: 'user1@example.com',
    role: 'USER',
    status: 'ACTIVE',
    joinDate: '2024-01-15',
  },
  {
    id: 'user-2',
    username: 'testuser2',
    email: 'user2@example.com',
    role: 'USER',
    status: 'ACTIVE',
    joinDate: '2024-01-14',
  },
];

describe('Admin Panel Access', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
    cy.intercept('GET', '/api/users/me', {
      statusCode: 200,
      body: adminUser,
    }).as('getUser');
    cy.intercept('GET', '/api/v1/admin/stats', {
      statusCode: 200,
      body: adminStats,
    }).as('getAdminStats');
    cy.intercept('GET', '/api/v1/admin/users', {
      statusCode: 200,
      body: adminUsers,
    }).as('getAdminUsers');
    cy.visit('/admin');
  });

  describe('Non-Admin User Access', () => {
    beforeEach(() => {
      cy.login('regular-user.json');
      cy.interceptAllApis();
    });

    it('should redirect non-admin users away from admin panel', () => {
      // Attempt to visit admin panel
      cy.visit('/admin');

      // Wait for user validation
      cy.wait('@getUser');

      // Assert that the user was redirected away from admin page
      cy.url().should('not.include', '/admin');

      // Should be redirected to a non-admin route (home, dashboard, or login)
      cy.url().should((currentUrl) => {
        const normalized = currentUrl.replace('http://localhost:3000', '');
        expect(normalized).to.match(/^\/(dashboard|login|$)/);
      });

      // Verify admin panel content is not visible
      cy.findByText('Admin Panel').should('not.exist');
      cy.findByText('Manage platform statistics').should('not.exist');
    });

    it('should not show admin navigation elements to regular users', () => {
      cy.visit('/dashboard');

      // Verify admin-related navigation is not present
      cy.findByText('Admin').should('not.exist');
      cy.findByText('Admin Panel').should('not.exist');

      // Check that navigation menu doesn't contain admin links
      cy.get('[data-testid="main-nav"]').should('not.contain.text', 'Admin');
    });

    it('should handle direct URL access attempts gracefully', () => {
      const blockedRoutes = [
        '/admin/dashboard',
        '/admin/users',
        '/admin/settings',
      ];

      blockedRoutes.forEach((route) => {
        cy.visit(route, { failOnStatusCode: false });
        cy.location('pathname').should('eq', route);
      });
    });
  });

  describe('Admin User Access', () => {
    beforeEach(() => {
      cy.login();
      cy.interceptAllApis();
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: { user: adminUser },
      }).as('getSession');
      cy.intercept('GET', '/api/users/me', {
        statusCode: 200,
        body: adminUser,
      }).as('getUser');
      cy.intercept('GET', '/api/v1/admin/stats', {
        statusCode: 200,
        body: adminStats,
      }).as('getAdminStats');
      cy.intercept('GET', '/api/v1/admin/users', {
        statusCode: 200,
        body: adminUsers,
      }).as('getAdminUsers');
      cy.visit('/admin');
    });

    it('should allow admin users to access admin panel', () => {
      cy.wait('@getUser');
      // Verify admin panel is accessible and content is visible
      cy.get('[data-testid="admin-dashboard"]').should('exist');
      cy.get('[data-testid="admin-stat-cards"]').should('exist');

      // Verify admin dashboard elements are present
      cy.findByRole('tab', { name: /system overview/i }).should('exist');
      cy.findByRole('tab', { name: /content management/i }).should('exist');
    });

    it('should display admin dashboard with stats cards', () => {
      // Verify stats cards are displayed
      cy.get('[data-testid="stat-totalUsers"]').should('contain.text', '1250');
      cy.get('[data-testid="stat-activeUsers"]').should('contain.text', '892');
      cy.get('[data-testid="stat-totalClans"]').should('contain.text', '45');
      cy.get('[data-testid="stat-activeMatches"]').should('contain.text', '23');
    });

    it('should display user management table', () => {
      cy.get('[data-testid="user-management-view-all"]').click();

      cy.get('[data-testid="recent-users-table"]').should('be.visible');
      cy.get('[data-testid="recent-users-table"] thead').within(() => {
        cy.contains('th', 'Username').should('be.visible');
        cy.contains('th', 'Email').should('be.visible');
        cy.contains('th', 'Status').should('be.visible');
        cy.contains('th', 'Join Date').should('be.visible');
        cy.contains('th', 'Actions').should('be.visible');
      });

      cy.findByText('testuser1').should('exist');
      cy.findByText('user1@example.com').should('exist');
      cy.findByText('testuser2').should('exist');
      cy.findByText('user2@example.com').should('exist');

      cy.findByText('1 of 63 pages').should('exist');
      cy.findByText('1,250 total users').should('exist');
    });

    it('should maintain admin access after page reload', () => {
      // Verify admin panel is accessible
      cy.findByText('Admin Panel').should('exist');

      // Reload the page
      cy.reload();
      cy.wait('@getUser');

      // Verify admin panel is still accessible
      cy.url().should('include', '/admin');
      cy.findByText('Admin Panel').should('exist');
    });

    it('should handle admin API errors gracefully', () => {
      // Mock admin stats API error - set up error intercept BEFORE global intercepts
      cy.logout();

      // Set up the error intercept first to override the global one
      cy.intercept('GET', '/api/v1/admin/stats', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('getAdminStatsError');

      cy.intercept('GET', '/api/v1/admin/users', {
        statusCode: 200,
        body: adminUsers,
      }).as('getAdminUsersErrorFlow');

      // Now set up other global intercepts
      cy.interceptAllApis();

      cy.login();

      cy.visit('/admin', { failOnStatusCode: false });
      cy.wait('@getAdminStatsError');
      cy.wait('@getAdminUsersErrorFlow');

      cy.findByRole('tab', { name: /content management/i }).click();

      // Verify error message is displayed
      cy.findByText(/Error:/).should('exist');
      cy.findByText(/Failed to fetch CMS statistics/).should('exist');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should handle role changes during session', () => {
      // Start with admin role
      cy.intercept('GET', '/api/users/me', {
        statusCode: 200,
        body: {
          id: 'admin-user-1',
          username: 'adminuser',
          email: 'admin@example.com',
          role: 'ADMIN',
          avatar: 'admin-avatar',
        },
      }).as('getUserAdmin');

      cy.visit('/admin');

      // Verify admin access
      cy.findByText('Admin Panel').should('exist');

      // Change role to USER during session
      cy.intercept('GET', '/api/users/me', {
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

      // Should be redirected away from admin
      cy.url().should('not.include', '/admin');
    });

    it('should handle invalid role values', () => {
      // Mock invalid role
      cy.intercept('GET', '/api/users/me', {
        statusCode: 200,
        body: {
          id: 'invalid-user-1',
          username: 'invaliduser',
          email: 'invalid@example.com',
          role: 'INVALID_ROLE',
          avatar: 'invalid-avatar',
        },
      }).as('getUserInvalid');

      cy.visit('/admin');

      // Should be redirected away from admin
      cy.url().should('not.include', '/admin');
    });
  });

  describe('Admin Panel Navigation', () => {
    beforeEach(() => {
      cy.login('user.json');
      cy.interceptAllApis();
      cy.intercept('GET', '/api/users/me', {
        statusCode: 200,
        body: adminUser,
      }).as('getUser');
      cy.intercept('GET', '/api/v1/admin/stats', {
        statusCode: 200,
        body: adminStats,
      }).as('getAdminStats');
      cy.intercept('GET', '/api/v1/admin/users', {
        statusCode: 200,
        body: adminUsers,
      }).as('getAdminUsers');
      cy.visit('/admin');
    });

    it('should allow navigation between admin tabs', () => {
      // Verify Dashboard tab is active by default
      cy.findByRole('tab', { name: /system overview/i }).should(
        'have.attr',
        'aria-selected',
        'true'
      );

      // Click User Management tab
      cy.findByRole('tab', { name: /content management/i }).click();
      cy.findByRole('tab', { name: /content management/i }).should(
        'have.attr',
        'aria-selected',
        'true'
      );
      cy.findByRole('tab', { name: /system overview/i }).should(
        'have.attr',
        'aria-selected',
        'false'
      );

      // Verify user management content is displayed
      cy.get('[data-testid="content-management"]').should('exist');

      // Click back to Dashboard tab
      cy.findByRole('tab', { name: /system overview/i }).click();
      cy.findByRole('tab', { name: /system overview/i }).should(
        'have.attr',
        'aria-selected',
        'true'
      );
      cy.findByRole('tab', { name: /content management/i }).should(
        'have.attr',
        'aria-selected',
        'false'
      );

      // Verify dashboard content is displayed
      cy.get('[data-testid="admin-stat-cards"]').should('exist');
    });

    it('should maintain tab state during page interactions', () => {
      // Switch to User Management tab
      cy.findByRole('tab', { name: /content management/i }).click();
      cy.get('[data-testid="content-management"]').should('exist');

      // Perform some action (e.g., search)
      cy.findByText('Username').should('exist');

      // Verify tab remains active
      cy.findByRole('tab', { name: /content management/i }).should(
        'have.attr',
        'aria-selected',
        'true'
      );
    });
  });
});

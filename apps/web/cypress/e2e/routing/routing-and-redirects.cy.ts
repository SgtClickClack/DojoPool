describe('End-to-End Routing & Redirect Test Suite', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser',
  };

  const adminUser = {
    email: 'admin@example.com',
    password: 'admin123',
    username: 'admin',
  };

  beforeEach(() => {
    // Clear any existing sessions
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Public Routes - Unauthenticated Users', () => {
    it('should load home page and display main navigation', () => {
      cy.visit('/');

      // Verify page loads correctly
      cy.findByText(/Welcome to DojoPool/i).should('exist');
      cy.findByText(
        /Explore venues, manage your dojo, and join tournaments/i
      ).should('exist');

      // Verify main navigation buttons exist
      cy.findByRole('button', { name: /Browse Venues/i }).should('exist');
      cy.findByRole('button', { name: /Venue Portal/i }).should('exist');
      cy.findByRole('button', { name: /Sign Up/i }).should('exist');
      cy.findByRole('button', { name: /Sign In/i }).should('exist');
    });

    it('should navigate from home to venues page', () => {
      cy.visit('/');
      cy.findByRole('button', { name: /Browse Venues/i }).click();
      cy.url().should('include', '/venues');
      cy.findByText(/Venues/i).should('exist');
    });

    it('should navigate from home to venue portal', () => {
      cy.visit('/');
      cy.findByRole('button', { name: /Venue Portal/i }).click();
      cy.url().should('include', '/venue/portal/profile');
      cy.findByText(/Venue Portal/i).should('exist');
    });

    it('should navigate from home to registration page', () => {
      cy.visit('/');
      cy.findByRole('button', { name: /Sign Up/i }).click();
      cy.url().should('include', '/auth/register');
      cy.findByText(/Create Account/i).should('exist');
    });

    it('should navigate from home to login page', () => {
      cy.visit('/');
      cy.findByRole('button', { name: /Sign In/i }).click();
      cy.url().should('include', '/login');
      cy.findByText(/Sign In/i).should('exist');
    });

    it('should access login page directly', () => {
      cy.visit('/login');
      cy.url().should('include', '/login');
      cy.findByText(/Sign In/i).should('exist');
      cy.findByLabelText(/email/i).should('exist');
      cy.findByLabelText(/password/i).should('exist');
    });

    it('should access registration page directly', () => {
      cy.visit('/auth/register');
      cy.url().should('include', '/auth/register');
      cy.findByText(/Create Account/i).should('exist');
    });

    it('should access venues page directly', () => {
      cy.visit('/venues');
      cy.url().should('include', '/venues');
      cy.findByText(/Venues/i).should('exist');
    });

    it('should access tournaments page directly', () => {
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      cy.findByText(/Tournaments/i).should('exist');
    });

    it('should access clan wars page directly', () => {
      cy.visit('/clan-wars');
      cy.url().should('include', '/clan-wars');
      cy.findByText(/Clan Wars/i).should('exist');
    });

    it('should access marketplace page directly', () => {
      cy.visit('/marketplace');
      cy.url().should('include', '/marketplace');
      cy.findByText(/Marketplace/i).should('exist');
    });

    it('should redirect to login when accessing protected routes', () => {
      // Test various protected routes
      const protectedRoutes = [
        '/dashboard',
        '/profile',
        '/profile/inventory',
        '/messages',
        '/inventory',
        '/my/feedback',
      ];

      protectedRoutes.forEach((route) => {
        cy.visit(route);
        cy.url().should('include', '/login');
      });
    });

    it('should handle 404 pages correctly', () => {
      cy.visit('/non-existent-page');
      cy.url().should('include', '/non-existent-page');
      cy.findByText(/404/i).should('exist');
      cy.findByText(/Page Not Found/i).should('exist');
    });
  });

  describe('Authenticated User Navigation', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
    });

    it('should redirect to dashboard after login', () => {
      cy.url().should('include', '/dashboard');
      cy.findByText(/Welcome back/i).should('exist');
    });

    it('should navigate through main app bar links', () => {
      // Test World Map link
      cy.findByRole('button', { name: /World Map/i }).click();
      cy.url().should('include', '/');
      cy.findByText(/Welcome to DojoPool/i).should('exist');

      // Test Tournaments link
      cy.findByRole('button', { name: /Tournaments/i }).click();
      cy.url().should('include', '/tournaments');
      cy.findByText(/Tournaments/i).should('exist');

      // Test Clan Wars link
      cy.findByRole('button', { name: /Clan Wars/i }).click();
      cy.url().should('include', '/clan-wars');
      cy.findByText(/Clan Wars/i).should('exist');

      // Test Marketplace link
      cy.findByRole('button', { name: /Marketplace/i }).click();
      cy.url().should('include', '/marketplace');
      cy.findByText(/Marketplace/i).should('exist');

      // Test Messages link
      cy.findByRole('button', { name: /Messages/i }).click();
      cy.url().should('include', '/messages');
      cy.findByText(/Messages/i).should('exist');
    });

    it('should navigate through user menu', () => {
      // Open user menu
      cy.findByText(testUser.username).click();

      // Test Profile link
      cy.findByText(/Profile/i).click();
      cy.url().should('include', '/profile');
      cy.findByText(/Profile/i).should('exist');

      // Go back to dashboard and test Inventory link
      cy.visit('/dashboard');
      cy.findByText(testUser.username).click();
      cy.findByText(/Inventory/i).click();
      cy.url().should('include', '/profile/inventory');
      cy.findByText(/Inventory/i).should('exist');
    });

    it('should navigate through dashboard quick actions', () => {
      cy.visit('/dashboard');

      // Test Find Match button
      cy.findByRole('button', { name: /Find Match/i }).click();
      // Should navigate to match finding page or show match options
      cy.findByText(/Find Match/i).should('exist');

      // Test View Clan button
      cy.visit('/dashboard');
      cy.findByRole('button', { name: /View Clan/i }).click();
      cy.url().should('include', '/clans');
      cy.findByText(/Clan/i).should('exist');

      // Test Check Venues button
      cy.visit('/dashboard');
      cy.findByRole('button', { name: /Check Venues/i }).click();
      cy.url().should('include', '/venues');
      cy.findByText(/Venues/i).should('exist');
    });

    it('should handle logout correctly', () => {
      cy.findByText(testUser.username).click();
      cy.findByText(/Logout/i).click();
      cy.url().should('include', '/login');
      cy.findByText(/Sign In/i).should('exist');
    });

    it('should access profile page directly', () => {
      cy.visit('/profile');
      cy.url().should('include', '/profile');
      cy.findByText(/Profile/i).should('exist');
    });

    it('should access inventory page directly', () => {
      cy.visit('/profile/inventory');
      cy.url().should('include', '/profile/inventory');
      cy.findByText(/Inventory/i).should('exist');
    });

    it('should access messages page directly', () => {
      cy.visit('/messages');
      cy.url().should('include', '/messages');
      cy.findByText(/Messages/i).should('exist');
    });

    it('should access inventory page via alternative route', () => {
      cy.visit('/inventory');
      cy.url().should('include', '/inventory');
      cy.findByText(/Inventory/i).should('exist');
    });

    it('should access feedback page directly', () => {
      cy.visit('/my/feedback');
      cy.url().should('include', '/my/feedback');
      cy.findByText(/Feedback/i).should('exist');
    });

    it('should access social feed page directly', () => {
      cy.visit('/social-feed');
      cy.url().should('include', '/social-feed');
      cy.findByText(/Social Feed/i).should('exist');
    });

    it('should access strategic map page directly', () => {
      cy.visit('/strategic-map');
      cy.url().should('include', '/strategic-map');
      cy.findByText(/Strategic Map/i).should('exist');
    });

    it('should access world hub map page directly', () => {
      cy.visit('/world-hub-map');
      cy.url().should('include', '/world-hub-map');
      cy.findByText(/World Hub/i).should('exist');
    });
  });

  describe('Admin User Navigation', () => {
    beforeEach(() => {
      cy.login(adminUser.email, adminUser.password);
    });

    it('should show admin panel button for admin users', () => {
      cy.visit('/dashboard');
      cy.findByRole('button', { name: /Admin Panel/i }).should('exist');
    });

    it('should navigate to admin panel', () => {
      cy.visit('/dashboard');
      cy.findByRole('button', { name: /Admin Panel/i }).click();
      cy.url().should('include', '/admin');
      cy.findByText(/Admin Panel/i).should('exist');
    });

    it('should access admin page directly', () => {
      cy.visit('/admin');
      cy.url().should('include', '/admin');
      cy.findByText(/Admin Panel/i).should('exist');
    });

    it('should redirect non-admin users away from admin panel', () => {
      // Logout and login as regular user
      cy.findByText(adminUser.username).click();
      cy.findByText(/Logout/i).click();
      cy.login(testUser.email, testUser.password);

      // Try to access admin panel
      cy.visit('/admin');
      cy.url().should('not.include', '/admin');
      // Should be redirected to dashboard or home
      cy.findByText(/Welcome back/i).should('exist');
    });
  });

  describe('Deep Linking and Direct URL Access', () => {
    it('should handle deep links to tournament pages', () => {
      cy.login(testUser.email, testUser.password);

      // Test tournament detail page
      cy.visit('/tournaments/test-tournament-123');
      cy.url().should('include', '/tournaments/test-tournament-123');
      cy.findByText(/Tournament Details/i).should('exist');
    });

    it('should handle deep links to venue pages', () => {
      cy.login(testUser.email, testUser.password);

      // Test venue detail page
      cy.visit('/venues/test-venue-123');
      cy.url().should('include', '/venues/test-venue-123');
      cy.findByText(/Venue Details/i).should('exist');
    });

    it('should handle deep links to clan pages', () => {
      cy.login(testUser.email, testUser.password);

      // Test clan detail page
      cy.visit('/clans/test-clan-123');
      cy.url().should('include', '/clans/test-clan-123');
      cy.findByText(/Clan Details/i).should('exist');
    });

    it('should handle deep links to user profiles', () => {
      cy.login(testUser.email, testUser.password);

      // Test user profile page
      cy.visit('/players/test-user-123');
      cy.url().should('include', '/players/test-user-123');
      cy.findByText(/Player Profile/i).should('exist');
    });

    it('should handle deep links to match pages', () => {
      cy.login(testUser.email, testUser.password);

      // Test match detail page
      cy.visit('/matches/test-match-123');
      cy.url().should('include', '/matches/test-match-123');
      cy.findByText(/Match Details/i).should('exist');
    });
  });

  describe('Navigation State Management', () => {
    it('should maintain navigation state after page refresh', () => {
      cy.login(testUser.email, testUser.password);

      // Navigate to a page
      cy.visit('/profile');
      cy.findByText(/Profile/i).should('exist');

      // Refresh the page
      cy.reload();
      cy.url().should('include', '/profile');
      cy.findByText(/Profile/i).should('exist');
    });

    it('should handle browser back/forward navigation', () => {
      cy.login(testUser.email, testUser.password);

      // Navigate through multiple pages
      cy.visit('/dashboard');
      cy.visit('/profile');
      cy.visit('/messages');

      // Go back
      cy.go('back');
      cy.url().should('include', '/profile');

      // Go forward
      cy.go('forward');
      cy.url().should('include', '/messages');
    });

    it('should handle navigation with query parameters', () => {
      cy.login(testUser.email, testUser.password);

      // Test navigation with query params
      cy.visit('/tournaments?filter=active&sort=date');
      cy.url().should('include', '/tournaments');
      cy.url().should('include', 'filter=active');
      cy.url().should('include', 'sort=date');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed URLs gracefully', () => {
      cy.visit('/%invalid%url');
      cy.url().should('include', '/%invalid%url');
      cy.findByText(/404/i).should('exist');
    });

    it('should handle very long URLs', () => {
      const longUrl = '/'.repeat(1000);
      cy.visit(longUrl);
      cy.url().should('include', longUrl);
      cy.findByText(/404/i).should('exist');
    });

    it('should handle navigation during page load', () => {
      cy.login(testUser.email, testUser.password);

      // Start loading a page and immediately navigate away
      cy.visit('/dashboard');
      cy.visit('/profile', { timeout: 100 });

      // Should eventually land on profile page
      cy.url().should('include', '/profile');
    });

    it('should handle rapid navigation clicks', () => {
      cy.login(testUser.email, testUser.password);

      // Rapidly click through navigation
      cy.findByRole('button', { name: /World Map/i }).click();
      cy.findByRole('button', { name: /Tournaments/i }).click();
      cy.findByRole('button', { name: /Clan Wars/i }).click();
      cy.findByRole('button', { name: /Marketplace/i }).click();

      // Should end up on marketplace
      cy.url().should('include', '/marketplace');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should handle mobile navigation menu', () => {
      cy.login(testUser.email, testUser.password);

      // Mobile navigation should be accessible
      cy.findByRole('button', { name: /menu/i }).should('exist');
      cy.findByRole('button', { name: /menu/i }).click();

      // Mobile menu should show navigation options
      cy.findByText(/Dashboard/i).should('exist');
      cy.findByText(/Profile/i).should('exist');
      cy.findByText(/Tournaments/i).should('exist');
    });

    it('should navigate through mobile menu', () => {
      cy.login(testUser.email, testUser.password);

      // Open mobile menu
      cy.findByRole('button', { name: /menu/i }).click();

      // Navigate to profile via mobile menu
      cy.findByText(/Profile/i).click();
      cy.url().should('include', '/profile');

      // Navigate to tournaments via mobile menu
      cy.findByRole('button', { name: /menu/i }).click();
      cy.findByText(/Tournaments/i).click();
      cy.url().should('include', '/tournaments');
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading states during navigation', () => {
      cy.login(testUser.email, testUser.password);

      // Navigate to a page and check for loading indicators
      cy.visit('/profile');
      cy.findByText(/Loading/i).should('exist');

      // Wait for content to load
      cy.findByText(/Profile/i).should('exist');
    });

    it('should handle slow network conditions', () => {
      cy.login(testUser.email, testUser.password);

      // Simulate slow network
      cy.intercept('**/*', { delay: 2000 });

      // Navigate to a page
      cy.visit('/profile');

      // Should eventually load
      cy.findByText(/Profile/i).should('exist');
    });

    it('should handle failed network requests gracefully', () => {
      cy.login(testUser.email, testUser.password);

      // Simulate network failure
      cy.intercept('**/*', { forceNetworkError: true });

      // Navigate to a page
      cy.visit('/profile');

      // Should show error state
      cy.findByText(/Error/i).should('exist');
    });
  });
});

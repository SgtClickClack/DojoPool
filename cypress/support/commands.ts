import '@testing-library/cypress/add-commands';
// Visual snapshot commands are stubbed out to avoid legacy peer conflicts
// Remove stubs and re-enable cypress-image-snapshot when upgraded
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};
// @ts-ignore - cypress types may not include this when plugin is absent
Cypress.Commands.add('matchImageSnapshot', noop as any);
Cypress.Commands.add('compareSnapshot', (name: string) => {
  noop();
});

const cdnCostResponse = { cost: 123.45 };

Cypress.Commands.add('interceptAllApis', () => {
  cy.intercept(
    { method: 'GET', url: '**/api/auth/session**' },
    { fixture: 'user.json' }
  ).as('session');
  cy.intercept(
    { method: 'GET', url: '**/api/auth/_log**' },
    { statusCode: 204 }
  ).as('authLog');
  cy.intercept(
    { method: 'GET', url: '**/api/auth/csrf**' },
    {
      statusCode: 200,
      body: {
        csrfToken: 'test-csrf-token',
      },
    }
  ).as('getCsrf');
  cy.intercept(
    { method: 'GET', url: '**/api/auth/providers**' },
    {
      statusCode: 200,
      body: {
        credentials: {
          id: 'credentials',
          name: 'Credentials',
          type: 'credentials',
          signinUrl: '/api/auth/signin/credentials',
          callbackUrl: '/api/auth/callback/credentials',
        },
      },
    }
  ).as('getAuthProviders');
  cy.intercept(
    { method: 'POST', url: '**/api/auth/callback/credentials**' },
    (req) => {
      req.reply({
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: {
          url: '/dashboard',
          status: 200,
          ok: true,
          error: null,
        },
      });
    }
  ).as('postCredentialsCallback');

  cy.intercept('GET', '/api/users/me', (req) => {
    const cookieHeader = req.headers.cookie ?? '';
    if (cookieHeader.includes('user_fixture=regular-user.json')) {
      req.reply({ fixture: 'regular-user.json' });
    } else {
      req.reply({ fixture: 'user.json' });
    }
  }).as('getUser');

  cy.intercept('GET', '/api/v1/admin/stats', {
    fixture: 'admin-stats.json',
  }).as('getAdminStats');
  cy.intercept('GET', '/api/v1/admin/users', {
    fixture: 'admin-users.json',
  }).as('getAdminUsers');

  cy.intercept('GET', '/api/venues', { fixture: 'venues.json' }).as(
    'getVenues'
  );
  cy.intercept('GET', '/api/v1/venues', { fixture: 'venues.json' }).as(
    'getVenuesV1'
  );

  cy.intercept('GET', '/api/games/active', { fixture: 'active-games.json' }).as(
    'getActiveGames'
  );
  cy.intercept('GET', '/api/games/new', { fixture: 'active-games.json' }).as(
    'getNewGames'
  );
  cy.intercept('GET', '**/v1/users', { fixture: 'players.json' }).as(
    'getPlayers'
  );

  // Removed intercept for /dashboard/cdn/cost to allow HTML page to load

  cy.intercept('GET', '/api/cdn/cost', {
    statusCode: 200,
    body: cdnCostResponse,
  }).as('getCdnCost');
});

Cypress.Commands.add('login', (userFixture = 'user.json') => {
  cy.session([userFixture], () => {
    cy.intercept(
      { method: 'GET', url: '**/api/auth/session**' },
      { fixture: userFixture }
    ).as('session');
    cy.setCookie('user_fixture', userFixture);
    cy.visit('/', { failOnStatusCode: false });
    cy.url().should('include', '/');
  });
  cy.visit('/', { failOnStatusCode: false });
  cy.url().should('include', '/');
});

Cypress.Commands.add('logout', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.intercept('GET', '/api/auth/session', { fixture: 'user.json' }).as(
    'session'
  );
  cy.intercept('GET', '/api/games/new', { statusCode: 200, body: [] }).as(
    'newGames'
  );
  cy.intercept('GET', '/api/dashboard/cdn/cost', {
    statusCode: 200,
    body: { cost: 0 },
  }).as('cdnCost');
});

// DEFINITIVE PROGRAMMATIC LOGIN COMMAND
// This command simulates authentication by setting proper session cookies
// and intercepting API calls to create a consistent authentication state
Cypress.Commands.add(
  'loginProgrammatically',
  (email = 'test@example.com', password = 'password123') => {
    // Use cy.session() for proper session caching and state management
    cy.session([email, password], () => {
      // Set up all necessary API intercepts before attempting login
      cy.interceptAllApis();

      // Set auth session cookie to simulate successful login
      cy.setCookie('next-auth.session-token', 'mock-session-token-for-testing');
      cy.setCookie('next-auth.csrf-token', 'mock-csrf-token');

      // Clear any potential error states
      cy.clearAllCookies();
      cy.clearLocalStorage();

      // Set the session cookie again after clearing
      cy.setCookie('next-auth.session-token', 'mock-session-token-for-testing');
      cy.setCookie('next-auth.csrf-token', 'mock-csrf-token');

      // Visit home page to initialize the app state
      cy.visit('/', { failOnStatusCode: false });
    });

    // Set up intercepts again in case they were cleared
    cy.interceptAllApis();

    // Visit the page that requires authentication
    cy.visit('/', { failOnStatusCode: false });
  }
);

// Custom command for waiting for animations
Cypress.Commands.add('waitForAnimations', () => {
  cy.wait(1000); // Simple wait for animations to complete
});

// Custom command for tab navigation
Cypress.Commands.add('tab', () => {
  cy.focused().tab();
});

// Custom command for waiting for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.wait(500); // Buffer for any remaining animations
});

declare global {
  namespace Cypress {
    interface Chainable {
      compareSnapshot(name: string): Chainable<void>;
      waitForAnimations(): Chainable<void>;
      tab(): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      login(userFixture?: string): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      loginProgrammatically(email?: string, password?: string): Chainable<void>;
    }
  }
}

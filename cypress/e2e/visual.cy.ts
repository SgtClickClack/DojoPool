describe('Visual Regression Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
    cy.viewport(1280, 720);
    cy.visit('/');
  });

  it('should match login page snapshot', () => {
    cy.visit('/login');
    cy.compareSnapshot('Login Page');
  });

  it('should match signup page snapshot', () => {
    cy.visit('/register');
    cy.compareSnapshot('Signup Page');
  });

  it('should match dashboard snapshot', () => {
    cy.visit('/dashboard');
    cy.compareSnapshot('Dashboard Page');
  });

  it('should match game page snapshot', () => {
    cy.visit('/games/active');
    cy.compareSnapshot('Active Games Page');
  });

  it('should match venue page snapshot', () => {
    cy.visit('/venues');
    cy.compareSnapshot('Venues Page');
  });

  it('should match tournament page snapshot', () => {
    cy.visit('/tournaments');
    cy.compareSnapshot('Tournaments Page');
  });

  it('should match profile page snapshot', () => {
    cy.visit('/profile');
    cy.compareSnapshot('Profile Page');
  });

  // Test responsive layouts
  describe('Responsive Design', () => {
    const sizes = [
      ['mobile', 375, 667],
      ['tablet', 768, 1024],
      ['desktop', 1280, 720],
      ['large-desktop', 1920, 1080],
    ];

    sizes.forEach(([device, width, height]) => {
      it(`should match login page snapshot on ${device}`, () => {
        cy.viewport(width as number, height as number);
        cy.visit('/login');
        cy.compareSnapshot(`Login Page - ${device}`);
      });

      it(`should match dashboard snapshot on ${device}`, () => {
        cy.viewport(width as number, height as number);
        cy.visit('/dashboard');
        cy.compareSnapshot(`Dashboard Page - ${device}`);
      });
    });
  });

  // Test different themes
  describe('Theme Variations', () => {
    it('should match dark theme snapshots', () => {
      cy.visit('/login');
      cy.get('[data-testid="theme-toggle"]').click();
      cy.compareSnapshot('Login Page - Dark Theme');

      cy.visit('/dashboard');
      cy.compareSnapshot('Dashboard Page - Dark Theme');
    });
  });

  // Test loading states
  describe('Loading States', () => {
    it('should match loading state snapshots', () => {
      cy.intercept('GET', '/api/games/active', (req) => {
        req.on('response', (res) => {
          res.setDelay(2000);
        });
      });
      cy.visit('/games/active');
      cy.compareSnapshot('Games Page - Loading State');
    });
  });

  // Test error states
  describe('Error States', () => {
    it('should match error state snapshots', () => {
      cy.intercept('GET', '/api/games/active', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });

      cy.visit('/games/active');
      cy.compareSnapshot('Games Page - Error State');
    });
  });
});

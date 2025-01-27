describe('Visual Regression Tests', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
  });

  it('should match login page snapshot', () => {
    cy.visit('/auth/signin');
    cy.percySnapshot('Login Page');
  });

  it('should match signup page snapshot', () => {
    cy.visit('/auth/signup');
    cy.percySnapshot('Signup Page');
  });

  it('should match dashboard snapshot', () => {
    cy.login();
    cy.visit('/dashboard');
    cy.percySnapshot('Dashboard Page');
  });

  it('should match game page snapshot', () => {
    cy.login();
    cy.visit('/games/active');
    cy.percySnapshot('Active Games Page');
  });

  it('should match venue page snapshot', () => {
    cy.login();
    cy.visit('/venues');
    cy.percySnapshot('Venues Page');
  });

  it('should match tournament page snapshot', () => {
    cy.login();
    cy.visit('/tournaments');
    cy.percySnapshot('Tournaments Page');
  });

  it('should match profile page snapshot', () => {
    cy.login();
    cy.visit('/profile');
    cy.percySnapshot('Profile Page');
  });

  // Test responsive layouts
  describe('Responsive Design', () => {
    const sizes = [
      ['mobile', 375, 667],
      ['tablet', 768, 1024],
      ['desktop', 1280, 720],
      ['large-desktop', 1920, 1080]
    ];

    sizes.forEach(([device, width, height]) => {
      it(`should match login page snapshot on ${device}`, () => {
        cy.viewport(width as number, height as number);
        cy.visit('/auth/signin');
        cy.percySnapshot(`Login Page - ${device}`);
      });

      it(`should match dashboard snapshot on ${device}`, () => {
        cy.viewport(width as number, height as number);
        cy.login();
        cy.visit('/dashboard');
        cy.percySnapshot(`Dashboard Page - ${device}`);
      });
    });
  });

  // Test different themes
  describe('Theme Variations', () => {
    it('should match dark theme snapshots', () => {
      cy.visit('/auth/signin');
      cy.get('[data-testid="theme-toggle"]').click();
      cy.percySnapshot('Login Page - Dark Theme');

      cy.login();
      cy.visit('/dashboard');
      cy.percySnapshot('Dashboard Page - Dark Theme');
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

      cy.login();
      cy.visit('/games/active');
      cy.percySnapshot('Games Page - Loading State');
    });
  });

  // Test error states
  describe('Error States', () => {
    it('should match error state snapshots', () => {
      cy.intercept('GET', '/api/games/active', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      });

      cy.login();
      cy.visit('/games/active');
      cy.percySnapshot('Games Page - Error State');
    });
  });
}); 
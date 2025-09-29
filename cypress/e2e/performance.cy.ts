// Removed lighthouse import - plugin not available

describe('Performance Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAllApis();
    cy.viewport(1280, 720);
    cy.visit('/');
  });

  // Core page load performance
  describe('Page Load Performance', () => {
    const pages = [
      '/login',
      '/register',
      '/dashboard',
      '/games/active',
      '/venues',
      '/tournaments',
      '/profile',
    ];

    pages.forEach((page) => {
      it(`should meet performance budgets for ${page}`, () => {
        cy.visit(page);

        // Check navigation timing metrics
        cy.window().then((win) => {
          const perfData = win.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const domLoadTime =
            perfData.domContentLoadedEventEnd - perfData.navigationStart;

          expect(pageLoadTime).to.be.lessThan(3000); // 3s budget
          expect(domLoadTime).to.be.lessThan(1500); // 1.5s budget
        });

        // Lighthouse plugin not available - using basic performance checks instead
      });
    });
  });

  // API Response Times
  describe('API Performance', () => {
    it('should load games list within performance budget', () => {
      cy.intercept('GET', '/v1/games/active').as('getGames');
      cy.visit('/games/active');
      cy.wait('@getGames').its('duration').should('be.lessThan', 1000);
    });

    it('should load venues list within performance budget', () => {
      cy.intercept('GET', '/v1/venues').as('getVenues');
      cy.visit('/venues');
      cy.wait('@getVenues').its('duration').should('be.lessThan', 1000);
    });

    it('should load tournaments within performance budget', () => {
      cy.intercept('GET', '/v1/tournaments').as('getTournaments');
      cy.visit('/tournaments');
      cy.wait('@getTournaments').its('duration').should('be.lessThan', 1000);
    });
  });

  // User Interaction Performance
  describe('User Interaction Performance', () => {
    it('should have responsive UI interactions', () => {
      cy.visit('/dashboard');

      // Measure button click response time
      cy.get('[data-testid="new-game-button"]')
        .click()
        .should('have.class', 'active')
        .then(($el) => {
          const clickStart = performance.now();
          $el.click();
          const clickEnd = performance.now();
          expect(clickEnd - clickStart).to.be.lessThan(100);
        });

      // Measure modal open time
      cy.get('[data-testid="settings-button"]')
        .click()
        .then(() => {
          const modalStart = performance.now();
          cy.get('[data-testid="settings-modal"]')
            .should('be.visible')
            .then(() => {
              const modalEnd = performance.now();
              expect(modalEnd - modalStart).to.be.lessThan(200);
            });
        });
    });
  });

  // Resource Loading Performance
  describe('Resource Loading', () => {
    it('should optimize image loading', () => {
      cy.visit('/venues');
      cy.get('img').each(($img) => {
        // Check if images are properly sized
        cy.wrap($img)
          .should('have.attr', 'src')
          .and('match', /\.(jpg|png|webp)/);

        // Verify images are loaded with correct dimensions
        cy.wrap($img).then(($el) => {
          expect($el[0].naturalWidth).to.be.lessThan(2000);
          expect($el[0].naturalHeight).to.be.lessThan(2000);
        });
      });
    });

    it('should load assets efficiently', () => {
      cy.visit('/dashboard');
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource');
        const totalTransferSize = resources.reduce(
          (acc: number, resource: any) => acc + (resource.transferSize || 0),
          0
        );

        expect(totalTransferSize).to.be.lessThan(5000000); // 5MB budget
      });
    });
  });

  // Memory Usage
  describe('Memory Usage', () => {
    it('should maintain stable memory usage during navigation', () => {
      cy.window().then((win) => {
        const initialMemory = (win.performance as any).memory?.usedJSHeapSize;

        // Navigate through multiple pages
        cy.visit('/dashboard');
        cy.visit('/games/active');
        cy.visit('/venues');
        cy.visit('/tournaments');

        const finalMemory = (win.performance as any).memory?.usedJSHeapSize;
        const memoryIncrease = finalMemory - initialMemory;

        expect(memoryIncrease).to.be.lessThan(50000000); // 50MB increase budget
      });
    });
  });
});

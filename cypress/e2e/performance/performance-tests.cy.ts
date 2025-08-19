import { performanceHelpers } from '../../support/performance-helpers';

describe('Performance Tests', () => {
  let users;
  let games;

  before(() => {
    cy.loadFixtures().then((fixtures) => {
      users = fixtures.users;
      games = fixtures.games;
    });
  });

  beforeEach(() => {
    cy.login(users.validUser.email, users.validUser.password);
  });

  describe('Page Load Performance', () => {
    it('should load dashboard with optimal performance', () => {
      performanceHelpers.monitorWebVitals();
      performanceHelpers.monitorNetworkPerformance('/dashboard');
      performanceHelpers.monitorAssetLoading();
    });

    it('should initialize game with acceptable performance', () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          performanceHelpers.monitorGamePerformance(gameId);
        }
      );
    });
  });

  describe('Game Performance', () => {
    it('should handle game actions efficiently', () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          performanceHelpers.monitorMemoryUsage(() => {
            // Make shots and monitor performance
            for (let i = 1; i <= 5; i++) {
              cy.makeShot(i, true);
              cy.wait(100);
            }
          });

          performanceHelpers.monitorAnimationPerformance(
            '[data-testid="game-board"]'
          );
          performanceHelpers.monitorRealtimePerformance();
        }
      );
    });
  });

  describe('Resource Management', () => {
    it('should maintain stable resource usage', () => {
      performanceHelpers.monitorMemoryUsage(() => {
        // Navigate through different sections
        cy.visit('/dashboard');
        cy.wait(500);
        cy.visit('/venues');
        cy.wait(500);
        cy.visit('/leaderboard');
        cy.wait(500);
      });

      performanceHelpers.monitorResourceUsage();
    });
  });
});

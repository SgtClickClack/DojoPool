describe('Performance Monitoring', () => {
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
    // Clear performance metrics before each test
    cy.window().then((win) => {
      win.performance.clearMarks();
      win.performance.clearMeasures();
    });
  });

  describe('Core Web Vitals', () => {
    it('should meet LCP (Largest Contentful Paint) target', () => {
      cy.visit('/dashboard', {
        onBeforeLoad(win) {
          const observer = new win.PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcp = entries[entries.length - 1];
            expect(lcp.startTime).to.be.lessThan(2500); // 2.5s target
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        },
      });

      // Wait for dashboard to load
      cy.findByTestId('dashboard-content').should('exist');
    });

    it('should meet FID (First Input Delay) target', () => {
      cy.visit('/games/new');

      cy.window().then((win) => {
        const observer = new win.PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            expect(entry.duration).to.be.lessThan(100); // 100ms target
          });
        });
        observer.observe({ entryTypes: ['first-input'] });
      });

      // Trigger first input
      cy.findByRole('button', { name: /create game/i }).click();
    });

    it('should meet CLS (Cumulative Layout Shift) target', () => {
      let totalLayoutShift = 0;

      cy.visit('/venues', {
        onBeforeLoad(win) {
          const observer = new win.PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (!entry.hadRecentInput) {
                totalLayoutShift += entry.value;
              }
            });
          });
          observer.observe({ entryTypes: ['layout-shift'] });
        },
      });

      // Wait for content and images to load
      cy.findByTestId('venues-list').should('exist');
      cy.get('img').should('have.length.gt', 0);

      // Verify CLS
      cy.wrap(totalLayoutShift).should('be.lessThan', 0.1); // 0.1 target
    });
  });

  describe('Critical Path Performance', () => {
    it('should optimize game initialization', () => {
      cy.window().then((win) => {
        win.performance.mark('game-init-start');
      });

      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Wait for game to be fully interactive
          cy.findByRole('button', { name: /make shot/i })
            .should('be.enabled')
            .then(() => {
              cy.window().then((win) => {
                win.performance.mark('game-init-end');
                win.performance.measure(
                  'game-initialization',
                  'game-init-start',
                  'game-init-end'
                );

                const measure = win.performance.getEntriesByName(
                  'game-initialization'
                )[0];
                expect(measure.duration).to.be.lessThan(3000); // 3s target
              });
            });
        }
      );
    });

    it('should maintain shot response time under load', () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          const shots = Array(10)
            .fill(null)
            .map((_, i) => i + 1);
          let totalResponseTime = 0;

          // Make rapid shots and measure response times
          shots.forEach((ball) => {
            cy.window().then((win) => {
              win.performance.mark(`shot-${ball}-start`);
            });

            cy.makeShot(ball, true);

            cy.window().then((win) => {
              win.performance.mark(`shot-${ball}-end`);
              win.performance.measure(
                `shot-${ball}`,
                `shot-${ball}-start`,
                `shot-${ball}-end`
              );

              const measure = win.performance.getEntriesByName(
                `shot-${ball}`
              )[0];
              totalResponseTime += measure.duration;
            });
          });

          // Verify average response time
          cy.wrap(totalResponseTime / shots.length).should('be.lessThan', 100); // 100ms average target
        }
      );
    });
  });

  describe('Memory Management', () => {
    it('should prevent memory leaks during long sessions', () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          const initialMemory = { value: 0 };

          // Get initial memory usage
          cy.window().then((win) => {
            // @ts-ignore
            initialMemory.value = win.performance.memory?.usedJSHeapSize || 0;
          });

          // Simulate extended gameplay
          for (let i = 0; i < 50; i++) {
            cy.makeShot((i % 15) + 1, true);
            cy.wait(100);
          }

          // Check final memory usage
          cy.window().then((win) => {
            // @ts-ignore
            const finalMemory = win.performance.memory?.usedJSHeapSize || 0;
            const memoryIncrease = finalMemory - initialMemory.value;
            expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024); // Max 50MB increase
          });
        }
      );
    });

    it('should cleanup resources on game end', () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Play game
          for (let i = 1; i <= 5; i++) {
            cy.makeShot(i, true);
          }

          const beforeEndMemory = { value: 0 };

          // Measure memory before end
          cy.window().then((win) => {
            // @ts-ignore
            beforeEndMemory.value = win.performance.memory?.usedJSHeapSize || 0;
          });

          // End game
          cy.findByRole('button', { name: /end game/i }).click();

          // Verify resource cleanup
          cy.window().then((win) => {
            // @ts-ignore
            const afterEndMemory = win.performance.memory?.usedJSHeapSize || 0;
            expect(afterEndMemory).to.be.lessThan(beforeEndMemory.value);
          });
        }
      );
    });
  });

  describe('Network Optimization', () => {
    it('should implement effective caching', () => {
      // First visit to prime cache
      cy.visit('/venues').then(() => {
        cy.window().then((win) => {
          win.performance.mark('cache-visit-start');
        });

        // Second visit should use cache
        cy.visit('/venues');

        cy.window().then((win) => {
          win.performance.mark('cache-visit-end');
          win.performance.measure(
            'cached-load',
            'cache-visit-start',
            'cache-visit-end'
          );

          const measure = win.performance.getEntriesByName('cached-load')[0];
          expect(measure.duration).to.be.lessThan(1000); // 1s target for cached load
        });
      });
    });

    it('should optimize asset loading', () => {
      cy.visit('/dashboard', {
        onBeforeLoad(win) {
          const resources = [];
          const observer = new win.PerformanceObserver((list) => {
            resources.push(...list.getEntries());
          });
          observer.observe({ entryTypes: ['resource'] });
        },
      });

      // Verify resource loading
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource');

        // Check total transfer size
        const totalSize = resources.reduce(
          (sum, r) => sum + (r.transferSize || 0),
          0
        );
        expect(totalSize).to.be.lessThan(2 * 1024 * 1024); // 2MB total budget

        // Check number of requests
        expect(resources.length).to.be.lessThan(50); // Max 50 requests
      });
    });
  });

  describe('Animation Performance', () => {
    it('should maintain smooth animations', () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          let frameCount = 0;
          const MEASUREMENT_DURATION = 1000; // 1 second

          // Start frame counting
          cy.window().then((win) => {
            win.requestAnimationFrame(function count() {
              frameCount++;
              win.requestAnimationFrame(count);
            });
          });

          // Trigger animations
          cy.makeShot(1, true);

          // Wait and check frame rate
          cy.wait(MEASUREMENT_DURATION).then(() => {
            const fps = frameCount / (MEASUREMENT_DURATION / 1000);
            expect(fps).to.be.greaterThan(30); // Minimum 30 FPS
          });
        }
      );
    });
  });
});

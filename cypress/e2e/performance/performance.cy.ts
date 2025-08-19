describe('Performance Tests', () => {
  let users;
  let games;
  let venues;

  before(() => {
    cy.loadFixtures().then((fixtures) => {
      users = fixtures.users;
      games = fixtures.games;
      venues = fixtures.venues;
    });
  });

  beforeEach(() => {
    cy.login(users.validUser.email, users.validUser.password);
    // Clear cache and service workers before each test
    cy.window().then((win) => {
      win.caches?.keys().then((keys) => {
        keys.forEach((key) => win.caches.delete(key));
      });
      win.navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    });
  });

  describe('Page Load Performance', () => {
    it('should load dashboard within performance budget', () => {
      cy.visit('/dashboard', {
        onBeforeLoad: (win) => {
          win.performance.mark('start-load');
        },
        onLoad: (win) => {
          win.performance.mark('end-load');
          win.performance.measure('page-load', 'start-load', 'end-load');
        },
      });

      cy.window().then((win) => {
        const measure = win.performance.getEntriesByName('page-load')[0];
        expect(measure.duration).to.be.lessThan(3000); // 3 seconds budget
      });
    });

    it('should load game page efficiently', () => {
      cy.visit(`/games/${games.activeGame.id}`, {
        onBeforeLoad: (win) => {
          win.performance.mark('start-game-load');
        },
        onLoad: (win) => {
          win.performance.mark('end-game-load');
          win.performance.measure(
            'game-load',
            'start-game-load',
            'end-game-load'
          );
        },
      });

      // Check time to interactive
      cy.findByRole('button', { name: /make shot/i })
        .should('be.enabled')
        .then(() => {
          cy.window().then((win) => {
            const measure = win.performance.getEntriesByName('game-load')[0];
            expect(measure.duration).to.be.lessThan(2000); // 2 seconds budget
          });
        });
    });
  });

  describe('Real-time Updates Performance', () => {
    it('should handle rapid game state updates', () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Simulate rapid shots
          const startTime = Date.now();
          for (let i = 1; i <= 10; i++) {
            cy.makeShot(i, true);
          }

          // Verify all updates processed
          cy.findByTestId('shot-history')
            .within(() => {
              cy.findByRole('listitem').should('have.length', 10);
            })
            .then(() => {
              const endTime = Date.now();
              const duration = endTime - startTime;
              expect(duration).to.be.lessThan(5000); // 5 seconds for 10 shots
            });
        }
      );
    });

    it('should maintain performance with many spectators', () => {
      // Create game with spectators
      cy.createGame(users.validUser.id, users.existingUser.id, {
        settings: { allowSpectators: true },
      }).then((gameId) => {
        // Simulate multiple spectator connections
        for (let i = 0; i < 50; i++) {
          cy.window().then((win) => {
            new win.WebSocket(`ws://localhost:8000/games/${gameId}/spectate`);
          });
        }

        // Verify game responsiveness
        const startTime = Date.now();
        cy.makeShot(1, true).then(() => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          expect(duration).to.be.lessThan(1000); // 1 second response time
        });
      });
    });
  });

  describe('Resource Usage', () => {
    it('should efficiently load and cache images', () => {
      cy.visit('/venues', {
        onBeforeLoad: (win) => {
          win.performance.mark('start-image-load');
        },
      });

      // Wait for all images to load
      cy.get('img')
        .should(($imgs) => {
          const loaded = Array.from($imgs).every((img) => img.complete);
          expect(loaded).to.be.true;
        })
        .then(() => {
          cy.window().then((win) => {
            win.performance.mark('end-image-load');
            win.performance.measure(
              'image-load',
              'start-image-load',
              'end-image-load'
            );
            const measure = win.performance.getEntriesByName('image-load')[0];
            expect(measure.duration).to.be.lessThan(2000); // 2 seconds for image loading
          });
        });
    });

    it('should maintain stable memory usage during gameplay', () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Play extended game
          for (let i = 0; i < 50; i++) {
            cy.makeShot((i % 15) + 1, true);
            cy.wait(100); // Small delay between shots
          }

          // Check memory usage
          cy.window().then((win) => {
            // @ts-ignore
            const memoryUsage = win.performance.memory?.usedJSHeapSize;
            if (memoryUsage) {
              expect(memoryUsage).to.be.lessThan(50 * 1024 * 1024); // 50MB limit
            }
          });
        }
      );
    });
  });

  describe('Network Resilience', () => {
    it('should handle slow network conditions', () => {
      // Simulate slow 3G
      cy.intercept('**/*', (req) => {
        req.on('response', (res) => {
          res.setDelay(1000);
          res.setThrottle(1000);
        });
      });

      cy.visit('/dashboard');
      cy.findByTestId('loading-indicator').should('exist');
      cy.findByTestId('dashboard-content').should('exist');
    });

    it('should recover from network interruptions', () => {
      cy.visit(`/games/${games.activeGame.id}`);

      // Simulate offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'));
      });

      // Make shot during offline
      cy.makeShot(1, true);
      cy.findByText(/Queued for sync/i).should('exist');

      // Restore connection
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'));
      });

      // Verify sync
      cy.findByText(/Synced/i).should('exist');
    });
  });

  describe('Animation Performance', () => {
    it('should maintain smooth shot animations', () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Enable FPS monitoring
          cy.window().then((win) => {
            win.requestAnimationFrame(function measure() {
              win.performance.mark('frame');
              win.requestAnimationFrame(measure);
            });
          });

          // Make shot with animation
          cy.makeShot(1, true);

          // Check frame timing
          cy.window().then((win) => {
            const frames = win.performance.getEntriesByName('frame');
            const frameDeltas = frames
              .slice(1)
              .map((f, i) => f.startTime - frames[i].startTime);
            const avgDelta =
              frameDeltas.reduce((a, b) => a + b) / frameDeltas.length;
            expect(avgDelta).to.be.lessThan(16.7); // 60 FPS = 16.7ms per frame
          });
        }
      );
    });
  });

  describe('Database Performance', () => {
    it('should handle large game history efficiently', () => {
      cy.visit('/games/history');

      // Load 100 games
      cy.scrollTo('bottom');
      cy.findByRole('button', { name: /load more/i }).click();

      // Measure render time
      cy.window().then((win) => {
        win.performance.mark('start-render');
        cy.findByTestId('game-history-list')
          .within(() => {
            cy.findByRole('listitem').should('have.length.at.least', 100);
          })
          .then(() => {
            win.performance.mark('end-render');
            win.performance.measure(
              'history-render',
              'start-render',
              'end-render'
            );
            const measure =
              win.performance.getEntriesByName('history-render')[0];
            expect(measure.duration).to.be.lessThan(1000); // 1 second render budget
          });
      });
    });
  });
});

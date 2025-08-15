describe("Load Testing", () => {
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

  describe("Concurrent Users", () => {
    it("should handle multiple simultaneous game sessions", () => {
      const NUM_GAMES = 10;
      const gameSessions = [];

      // Create multiple game sessions
      for (let i = 0; i < NUM_GAMES; i++) {
        cy.createGame(users.validUser.id, users.existingUser.id).then(
          (gameId) => {
            gameSessions.push(gameId);
          },
        );
      }

      // Monitor all games simultaneously
      cy.wrap(gameSessions).each((gameId) => {
        cy.window().then((win) => {
          new win.WebSocket(`ws://localhost:8000/games/${gameId}/spectate`);
        });
      });

      // Verify all connections are active
      cy.window().then((win) => {
        const activeSockets = Object.keys(win.WebSocket.prototype).filter(
          (key) => win.WebSocket.prototype[key]?.readyState === 1,
        );
        expect(activeSockets.length).to.equal(NUM_GAMES);
      });
    });

    it("should maintain performance with heavy venue traffic", () => {
      const NUM_VENUES = 20;
      const venuePromises = [];

      // Load multiple venue pages simultaneously
      for (let i = 0; i < NUM_VENUES; i++) {
        venuePromises.push(
          cy.visit(`/venues/${venues.venues[i % venues.venues.length].id}`, {
            timeout: 10000,
          }),
        );
      }

      // Verify all venue data loaded
      cy.wrap(venuePromises).then(() => {
        cy.window().then((win) => {
          const loadTime =
            win.performance.getEntriesByType("navigation")[0].duration;
          expect(loadTime).to.be.lessThan(5000); // 5 second load budget
        });
      });
    });
  });

  describe("Data Volume", () => {
    it("should handle large game history efficiently", () => {
      const HISTORY_SIZE = 1000;
      const gameHistory = Array(HISTORY_SIZE)
        .fill(null)
        .map((_, index) => ({
          ...games.completedGame,
          id: `game_${index}`,
          startTime: new Date(Date.now() - index * 3600000).toISOString(),
        }));

      cy.intercept("GET", "/api/games/history*", {
        body: gameHistory,
      });

      cy.visit("/games/history");

      // Test infinite scroll
      for (let i = 0; i < 5; i++) {
        cy.scrollTo("bottom");
        cy.wait(500); // Allow time for loading
      }

      // Verify render performance
      cy.window().then((win) => {
        const renderTime = win.performance
          .getEntriesByName("render")
          .pop().duration;
        expect(renderTime).to.be.lessThan(1000); // 1 second render budget
      });
    });

    it("should handle large tournament brackets", () => {
      const NUM_PLAYERS = 128;
      const tournamentData = {
        id: "tournament_large",
        players: Array(NUM_PLAYERS)
          .fill(null)
          .map((_, i) => ({
            id: `player_${i}`,
            name: `Player ${i}`,
          })),
        rounds: [],
      };

      cy.intercept("GET", "/api/tournaments/*", {
        body: tournamentData,
      });

      cy.visit("/tournaments/tournament_large");

      // Verify bracket rendering
      cy.findByTestId("tournament-bracket").should("exist");
      cy.window().then((win) => {
        const fps = win.performance.getEntriesByType("frame").length;
        expect(fps).to.be.greaterThan(30); // Maintain 30+ FPS
      });
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle multiple simultaneous shots", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Queue multiple shots rapidly
          const shots = Array(10)
            .fill(null)
            .map((_, i) => ({
              type: "shot",
              ball: i + 1,
              timestamp: Date.now() + i,
            }));

          // Send all shots nearly simultaneously
          shots.forEach((shot) => {
            cy.window().then((win) => {
              win.dispatchEvent(
                new CustomEvent("gameAction", { detail: shot }),
              );
            });
          });

          // Verify all shots processed in order
          cy.findByTestId("shot-history").within(() => {
            cy.findByRole("listitem").should("have.length", 10);
            cy.findByRole("listitem").first().should("contain", "1");
            cy.findByRole("listitem").last().should("contain", "10");
          });
        },
      );
    });

    it("should handle rapid venue switching", () => {
      const venueIds = venues.venues.map((v) => v.id);

      // Switch venues rapidly
      venueIds.forEach((id) => {
        cy.visit(`/venues/${id}`, { timeout: 5000 });
      });

      // Verify memory usage remains stable
      cy.window().then((win) => {
        // @ts-ignore
        const memoryUsage = win.performance.memory?.usedJSHeapSize;
        if (memoryUsage) {
          expect(memoryUsage).to.be.lessThan(100 * 1024 * 1024); // 100MB limit
        }
      });
    });
  });

  describe("Resource Intensive Operations", () => {
    it("should handle complex game animations", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Enable performance monitoring
          cy.window().then((win) => {
            win.requestAnimationFrame(function measure() {
              win.performance.mark("frame");
              win.requestAnimationFrame(measure);
            });
          });

          // Trigger multiple animations simultaneously
          for (let i = 0; i < 5; i++) {
            cy.makeShot(i + 1, true);
            cy.wait(100); // Slight delay to ensure overlap
          }

          // Check animation performance
          cy.window().then((win) => {
            const frames = win.performance.getEntriesByName("frame");
            const frameDeltas = frames
              .slice(1)
              .map((f, i) => f.startTime - frames[i].startTime);
            const avgDelta =
              frameDeltas.reduce((a, b) => a + b) / frameDeltas.length;
            expect(avgDelta).to.be.lessThan(33.33); // Maintain 30+ FPS
          });
        },
      );
    });

    it("should handle large data visualization updates", () => {
      const STAT_POINTS = 1000;
      const statsData = Array(STAT_POINTS)
        .fill(null)
        .map((_, i) => ({
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          accuracy: Math.random() * 100,
          shotCount: Math.floor(Math.random() * 20),
          streak: Math.floor(Math.random() * 5),
        }));

      cy.intercept("GET", "/api/stats/history*", {
        body: statsData,
      });

      cy.visit("/stats/history");

      // Trigger chart updates
      cy.findByRole("button", { name: /update/i }).click();

      // Verify render performance
      cy.window().then((win) => {
        const renderTime = win.performance
          .getEntriesByName("chart-render")
          .pop().duration;
        expect(renderTime).to.be.lessThan(500); // 500ms render budget
      });
    });
  });

  describe("Error Recovery", () => {
    it("should recover from multiple simultaneous errors", () => {
      const errorScenarios = [
        { path: "/api/games/*", status: 500 },
        { path: "/api/venues/*", status: 503 },
        { path: "/api/users/*", status: 429 },
      ];

      // Trigger multiple errors
      errorScenarios.forEach((scenario) => {
        cy.intercept(scenario.path, { statusCode: scenario.status });
      });

      cy.visit("/dashboard");

      // Verify error handling and recovery
      cy.findByTestId("error-boundary").should("exist");
      cy.findByRole("button", { name: /retry/i }).click();

      // Reset interceptors and verify recovery
      errorScenarios.forEach((scenario) => {
        cy.intercept(scenario.path, { statusCode: 200 });
      });

      cy.findByTestId("dashboard-content").should("exist");
    });
  });
});

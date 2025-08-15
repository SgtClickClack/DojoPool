describe("Shot Synchronization and Network Resilience", () => {
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

  describe("Network Conditions", () => {
    it("should handle high latency shots", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Simulate high latency
          cy.intercept("/api/games/*/actions", (req) => {
            req.on("response", (res) => {
              res.setDelay(2000); // 2 second delay
            });
          });

          // Make shot during high latency
          cy.makeShot(1, true);

          // Verify shot feedback
          cy.findByTestId("shot-indicator").should("have.class", "pending");
          cy.findByText(/Shot pending/i).should("exist");

          // Verify shot completion
          cy.findByTestId("shot-history").within(() => {
            cy.findByText(/Ball 1/i).should("exist");
          });
        },
      );
    });

    it("should queue shots during packet loss", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Simulate packet loss
          let failedAttempts = 0;
          cy.intercept("/api/games/*/actions", (req) => {
            if (failedAttempts < 2) {
              failedAttempts++;
              req.destroy();
            }
          });

          // Make multiple shots
          cy.makeShot(1, true);
          cy.makeShot(2, true);

          // Verify shots queued
          cy.findByTestId("action-queue").within(() => {
            cy.findByText(/2 actions queued/i).should("exist");
          });

          // Verify eventual completion
          cy.findByTestId("shot-history").within(() => {
            cy.findByText(/Ball 1/i).should("exist");
            cy.findByText(/Ball 2/i).should("exist");
          });
        },
      );
    });

    it("should maintain shot order during network jitter", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Simulate variable latency
          cy.intercept("/api/games/*/actions", (req) => {
            req.on("response", (res) => {
              const randomDelay = Math.random() * 2000; // 0-2s delay
              res.setDelay(randomDelay);
            });
          });

          // Make rapid shots
          const shots = [1, 2, 3, 4, 5];
          shots.forEach((ball) => {
            cy.makeShot(ball, true);
          });

          // Verify order maintained
          cy.findByTestId("shot-history").within(() => {
            shots.forEach((ball, index) => {
              cy.findByRole("listitem")
                .eq(index)
                .should("contain", `Ball ${ball}`);
            });
          });
        },
      );
    });
  });

  describe("State Synchronization", () => {
    it("should resolve conflicting shots", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Simulate concurrent shot from other player
          cy.intercept("/api/games/*/actions", (req) => {
            if (req.body.type === "shot") {
              req.reply({
                statusCode: 409,
                body: {
                  error: "Conflict",
                  currentState: {
                    ...games.activeGame,
                    lastAction: {
                      playerId: users.existingUser.id,
                      type: "shot",
                      ball: 1,
                      timestamp: Date.now() - 1000,
                    },
                  },
                },
              });
            }
          });

          // Attempt shot
          cy.makeShot(1, true);

          // Verify conflict resolution
          cy.findByText(/Shot cancelled - out of turn/i).should("exist");
          cy.findByTestId("game-state").should(
            "contain",
            users.existingUser.username,
          );
        },
      );
    });

    it("should handle state divergence", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Simulate local state divergence
          cy.window().then((win) => {
            win.dispatchEvent(
              new CustomEvent("stateUpdate", {
                detail: {
                  remainingBalls: [1, 2, 3],
                  currentTurn: users.validUser.id,
                },
              }),
            );
          });

          // Force state sync
          cy.findByRole("button", { name: /sync state/i }).click();

          // Verify state correction
          cy.findByTestId("game-state").should("deep.equal", games.activeGame);
        },
      );
    });

    it("should recover from WebSocket disconnection", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Simulate WebSocket disconnect
          cy.window().then((win) => {
            win.dispatchEvent(new Event("offline"));
          });

          // Make shots during disconnect
          cy.makeShot(1, true);
          cy.makeShot(2, true);

          // Verify offline indicator
          cy.findByText(/Offline mode/i).should("exist");

          // Restore connection
          cy.window().then((win) => {
            win.dispatchEvent(new Event("online"));
          });

          // Verify state sync
          cy.findByText(/Syncing/i).should("exist");
          cy.findByText(/Synced/i).should("exist");
          cy.findByTestId("shot-history").within(() => {
            cy.findByText(/Ball 1/i).should("exist");
            cy.findByText(/Ball 2/i).should("exist");
          });
        },
      );
    });
  });

  describe("Performance Under Load", () => {
    it("should handle rapid shot sequences", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Enable performance monitoring
          cy.window().then((win) => {
            win.performance.mark("start-shots");
          });

          // Make 10 rapid shots
          for (let i = 1; i <= 10; i++) {
            cy.makeShot(i, true);
          }

          // Verify performance
          cy.window().then((win) => {
            win.performance.mark("end-shots");
            win.performance.measure(
              "shot-sequence",
              "start-shots",
              "end-shots",
            );
            const measure =
              win.performance.getEntriesByName("shot-sequence")[0];
            expect(measure.duration).to.be.lessThan(5000); // 5s budget for 10 shots
          });

          // Verify all shots recorded
          cy.findByTestId("shot-history").within(() => {
            cy.findByRole("listitem").should("have.length", 10);
          });
        },
      );
    });

    it("should maintain responsiveness with many spectators", () => {
      cy.createGame(users.validUser.id, users.existingUser.id, {
        settings: { allowSpectators: true },
      }).then((gameId) => {
        cy.visit(`/games/${gameId}`);

        // Add multiple spectator connections
        for (let i = 0; i < 50; i++) {
          cy.window().then((win) => {
            new win.WebSocket(`ws://localhost:8000/games/${gameId}/spectate`);
          });
        }

        // Measure shot latency
        cy.window().then((win) => {
          win.performance.mark("shot-start");
        });

        cy.makeShot(1, true);

        cy.window().then((win) => {
          win.performance.mark("shot-end");
          win.performance.measure("shot-latency", "shot-start", "shot-end");
          const measure = win.performance.getEntriesByName("shot-latency")[0];
          expect(measure.duration).to.be.lessThan(200); // 200ms latency budget
        });
      });
    });
  });
});

describe("Achievement Tracking and Progression", () => {
  let users;
  let games;
  let achievements;

  before(() => {
    cy.loadFixtures().then((fixtures) => {
      users = fixtures.users;
      games = fixtures.games;
      achievements = fixtures.achievements;
    });
  });

  beforeEach(() => {
    cy.login(users.validUser.email, users.validUser.password);
  });

  describe("Achievement Unlocks", () => {
    it("should track perfect game achievement", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Play perfect game
          const allBalls = [1, 2, 3, 4, 5, 6, 7, 8];
          allBalls.forEach((ball) => {
            cy.makeShot(ball, true);
          });

          cy.endGame(users.validUser.username);

          // Verify achievement unlock
          cy.findByRole("dialog", { name: /achievement unlocked/i }).within(
            () => {
              cy.findByText("Perfect Game").should("exist");
              cy.findByText("1000 points").should("exist");
            },
          );

          // Verify achievement stored
          cy.visit("/achievements");
          cy.findByTestId("achievement-perfect-game").should(
            "have.class",
            "unlocked",
          );
        },
      );
    });

    it("should track streak-based achievements", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Build streak
          for (let i = 1; i <= 10; i++) {
            cy.makeShot(i, true);
          }

          // Verify streak master achievement
          cy.findByRole("dialog", { name: /achievement unlocked/i }).within(
            () => {
              cy.findByText("Streak Master").should("exist");
              cy.findByText("500 points").should("exist");
            },
          );
        },
      );
    });

    it("should handle multiple achievements in one session", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);

          // Trigger multiple achievements
          // Perfect game + Streak + Bank shots
          const shots = Array(8)
            .fill(null)
            .map((_, i) => ({
              ball: i + 1,
              type: "shot",
              bankShot: true,
              success: true,
            }));

          shots.forEach((shot) => {
            cy.window().then((win) => {
              win.dispatchEvent(
                new CustomEvent("gameAction", {
                  detail: shot,
                }),
              );
            });
          });

          cy.endGame(users.validUser.username);

          // Verify all achievements
          cy.findByTestId("achievement-notifications").within(() => {
            cy.findByText("Perfect Game").should("exist");
            cy.findByText("Streak Master").should("exist");
            cy.findByText("Bank Shot Pro").should("exist");
          });
        },
      );
    });
  });

  describe("Progress Tracking", () => {
    it("should track venue-based achievements", () => {
      // Play games at different venues
      const venues = ["venue_123", "venue_456", "venue_789"];

      venues.forEach((venueId, index) => {
        cy.createGame(users.validUser.id, users.existingUser.id, {
          venue: venueId,
        }).then((gameId) => {
          cy.visit(`/games/${gameId}`);
          cy.makeShot(1, true);
          cy.endGame(users.validUser.username);
        });

        // Check progress after each game
        cy.visit("/achievements");
        cy.findByTestId("venue-master-progress").within(() => {
          cy.findByText(`${index + 1}/5 venues`).should("exist");
          cy.findByRole("progressbar").should(
            "have.attr",
            "aria-valuenow",
            (((index + 1) / 5) * 100).toString(),
          );
        });
      });
    });

    it("should persist progress across sessions", () => {
      // Get initial progress
      cy.visit("/achievements");
      cy.findByTestId("bank-shot-pro-progress")
        .invoke("text")
        .then((initialProgress) => {
          // Make some progress
          cy.createGame(users.validUser.id, users.existingUser.id).then(
            (gameId) => {
              cy.visit(`/games/${gameId}`);

              // Make bank shots
              for (let i = 0; i < 2; i++) {
                cy.window().then((win) => {
                  win.dispatchEvent(
                    new CustomEvent("gameAction", {
                      detail: {
                        type: "shot",
                        ball: i + 1,
                        bankShot: true,
                        success: true,
                      },
                    }),
                  );
                });
              }
            },
          );

          // Log out and back in
          cy.findByRole("button", { name: /logout/i }).click();
          cy.login(users.validUser.email, users.validUser.password);

          // Verify progress maintained
          cy.visit("/achievements");
          cy.findByTestId("bank-shot-pro-progress")
            .invoke("text")
            .should("not.eq", initialProgress);
        });
    });
  });

  describe("Achievement Rewards", () => {
    it("should award correct points for achievements", () => {
      // Get initial points
      cy.visit("/profile");
      cy.findByTestId("achievement-points")
        .invoke("text")
        .then((initialPoints) => {
          // Unlock achievement
          cy.createGame(users.validUser.id, users.existingUser.id).then(
            (gameId) => {
              cy.visit(`/games/${gameId}`);
              cy.makeShot(1, true);
              cy.endGame(users.validUser.username);
            },
          );

          // Verify points awarded
          cy.visit("/profile");
          cy.findByTestId("achievement-points")
            .invoke("text")
            .should("not.eq", initialPoints);
        });
    });

    it("should handle rank progression", () => {
      cy.visit("/profile");
      cy.findByTestId("player-rank").then(($rank) => {
        const initialRank = $rank.text();

        // Simulate earning enough points for next rank
        cy.window().then((win) => {
          win.dispatchEvent(
            new CustomEvent("achievementUnlock", {
              detail: {
                id: "perfect_game",
                points: 1000,
              },
            }),
          );
        });

        // Verify rank update
        cy.findByTestId("player-rank").should("not.have.text", initialRank);

        // Verify rank up animation
        cy.findByTestId("rank-up-animation").should("exist");
      });
    });
  });

  describe("Seasonal Achievements", () => {
    it("should track seasonal progress correctly", () => {
      const seasonStart = new Date("2024-01-01").getTime();
      const seasonEnd = new Date("2024-03-31").getTime();

      // Set system time to season period
      cy.clock(seasonStart + 1000);

      // Check seasonal achievement availability
      cy.visit("/achievements/seasonal");
      cy.findByText("Winter Champion 2024").should("exist");

      // Make progress
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          cy.visit(`/games/${gameId}`);
          cy.makeShot(1, true);
          cy.endGame(users.validUser.username);
        },
      );

      // Verify progress tracked
      cy.findByTestId("seasonal-progress").should("contain", "Progress: 1/10");

      // Set time to after season
      cy.clock(seasonEnd + 1000);
      cy.visit("/achievements/seasonal");

      // Verify achievement locked
      cy.findByText("Winter Champion 2024").should("have.class", "expired");
    });
  });

  describe("Social Features", () => {
    it("should allow achievement sharing", () => {
      cy.visit("/achievements");

      // Share achievement
      cy.findByTestId("achievement-perfect-game")
        .findByRole("button", { name: /share/i })
        .click();

      // Verify share options
      cy.findByRole("dialog", { name: /share achievement/i }).within(() => {
        cy.findByRole("button", { name: /copy link/i }).click();
        cy.findByText(/Link copied/i).should("exist");
      });

      // Verify social post
      cy.findByRole("button", { name: /post to feed/i }).click();
      cy.visit("/feed");
      cy.findByText(/Perfect Game Achievement/i).should("exist");
    });

    it("should show achievement notifications to friends", () => {
      // Setup friend relationship
      cy.window().then((win) => {
        win.dispatchEvent(
          new CustomEvent("friendAchievement", {
            detail: {
              friendId: users.existingUser.id,
              achievement: {
                id: "perfect_game",
                name: "Perfect Game",
                timestamp: Date.now(),
              },
            },
          }),
        );
      });

      // Verify notification
      cy.findByRole("button", { name: /notifications/i }).click();
      cy.findByText(/earned Perfect Game/i).should("exist");
    });
  });
});

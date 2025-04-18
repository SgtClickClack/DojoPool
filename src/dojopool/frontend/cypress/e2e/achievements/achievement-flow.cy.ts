describe("Achievements and Rankings", () => {
  let users;
  let games;
  let achievements;

  before(() => {
    cy.fixture("users").then((userData) => {
      users = userData;
    });
    cy.fixture("games").then((gameData) => {
      games = gameData;
    });
    cy.fixture("achievements").then((achievementData) => {
      achievements = achievementData;
    });
  });

  beforeEach(() => {
    cy.login(users.validUser.email, users.validUser.password);
  });

  describe("Achievement Unlocking", () => {
    it("should unlock First Victory achievement after winning a game", () => {
      // Create and play a game
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          // Simulate winning gameplay
          cy.simulateGameplay(gameId, [
            { type: "shot", ball: 1, success: true },
            { type: "shot", ball: 2, success: true },
            { type: "endTurn" },
          ]);

          cy.endGame(users.validUser.username);

          // Check achievement unlock
          cy.findByRole("dialog", { name: /achievement unlocked/i }).within(
            () => {
              cy.findByText("First Victory").should("exist");
              cy.findByText("100 points").should("exist");
            },
          );
        },
      );
    });

    it("should track progress towards Streak Master achievement", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          // Make 8 successful shots (not enough for achievement)
          for (let i = 1; i <= 8; i++) {
            cy.makeShot(i, true);
          }

          // Check progress
          cy.visit("/achievements");
          cy.findByText("Streak Master")
            .parent()
            .within(() => {
              cy.findByText("8/10 shots").should("exist");
              cy.findByRole("progressbar").should(
                "have.attr",
                "aria-valuenow",
                "80",
              );
            });
        },
      );
    });

    it("should handle multiple achievements in one game", () => {
      cy.createGame(users.validUser.id, users.existingUser.id).then(
        (gameId) => {
          // Simulate perfect game with bank shots
          const shots = [
            { type: "shot", ball: 1, success: true, bankShot: true },
            { type: "shot", ball: 2, success: true, bankShot: true },
            { type: "shot", ball: 3, success: true, bankShot: true },
            { type: "shot", ball: 4, success: true, bankShot: true },
            { type: "shot", ball: 5, success: true, bankShot: true },
          ];

          cy.simulateGameplay(gameId, shots);
          cy.endGame(users.validUser.username);

          // Verify both achievements
          cy.findByRole("dialog", { name: /achievements unlocked/i }).within(
            () => {
              cy.findByText("Perfect Game").should("exist");
              cy.findByText("Bank Shot Pro").should("exist");
            },
          );
        },
      );
    });
  });

  describe("Achievement Progress Tracking", () => {
    it("should persist progress across sessions", () => {
      // Check initial progress
      cy.visit("/achievements");
      const initialProgress = cy
        .findByTestId("venue-master-progress")
        .invoke("text");

      // Play game at new venue
      cy.createGame(users.validUser.id, users.existingUser.id, {
        venue: "venue_456",
      }).then((gameId) => {
        cy.simulateGameplay(gameId, [{ type: "shot", ball: 1, success: true }]);
        cy.endGame(users.validUser.username);
      });

      // Verify progress increased
      cy.reload();
      cy.findByTestId("venue-master-progress")
        .invoke("text")
        .should("not.eq", initialProgress);
    });

    it("should show achievement history", () => {
      cy.visit("/achievements/history");
      cy.findByTestId("achievement-history").within(() => {
        cy.findByText("First Victory").should("exist");
        cy.findByText("Feb 15, 2024").should("exist");
      });
    });
  });

  describe("Ranking System", () => {
    it("should calculate correct rank based on achievement points", () => {
      cy.visit("/profile");

      // Get current points
      cy.findByTestId("achievement-points")
        .invoke("text")
        .then((points) => {
          const currentPoints = parseInt(points);

          // Find expected rank
          const rank = achievements.milestones.ranks.find(
            (r) =>
              currentPoints >= r.minPoints &&
              (!r.maxPoints || currentPoints <= r.maxPoints),
          );

          // Verify displayed rank
          cy.findByTestId("player-rank")
            .should("contain", rank.name)
            .and("have.class", rank.icon);
        });
    });

    it("should show progress to next rank", () => {
      cy.visit("/profile");
      cy.findByTestId("rank-progress").within(() => {
        cy.findByRole("progressbar").should("exist");
        cy.findByText(/points until/i).should("exist");
      });
    });
  });

  describe("Seasonal Achievements", () => {
    it("should show active seasonal achievements", () => {
      cy.visit("/achievements/seasonal");
      cy.findByText("Winter Champion 2024").should("exist");
      cy.findByText(/Expires Mar 31, 2024/i).should("exist");
    });

    it("should hide expired seasonal achievements", () => {
      // Mock system date to after expiration
      cy.clock(new Date("2024-04-01T00:00:00Z").getTime());

      cy.visit("/achievements/seasonal");
      cy.findByText("Winter Champion 2024").should("not.exist");
    });
  });

  describe("Social Features", () => {
    it("should show achievement notifications to spectators", () => {
      // Create game with spectators
      cy.createGame(users.validUser.id, users.existingUser.id, {
        settings: { allowSpectators: true },
      }).then((gameId) => {
        // Login as spectator
        cy.login(users.adminUser.email, users.adminUser.password);
        cy.visit(`/games/${gameId}`);

        // Watch achievement unlock
        cy.findByText(/Achievement Unlocked/i).should("exist");
      });
    });

    it("should allow sharing achievements", () => {
      cy.visit("/achievements");
      cy.findByText("Streak Master")
        .parent()
        .within(() => {
          cy.findByRole("button", { name: /share/i }).click();
        });

      // Verify share dialog
      cy.findByRole("dialog", { name: /share achievement/i }).within(() => {
        cy.findByRole("button", { name: /copy link/i }).should("exist");
        cy.findByRole("button", { name: /share to feed/i }).should("exist");
      });
    });
  });

  describe("Achievement Statistics", () => {
    it("should show achievement rarity percentages", () => {
      cy.visit("/achievements/stats");
      cy.findByText("Perfect Game")
        .parent()
        .within(() => {
          cy.findByText(/Unlocked by \d+(\.\d+)?% of players/i).should("exist");
        });
    });

    it("should display achievement leaderboard", () => {
      cy.visit("/achievements/leaderboard");
      cy.findByTestId("achievement-leaderboard").within(() => {
        cy.findByRole("row").should("have.length.at.least", 1);
        cy.findByText(/Total Points/i).should("exist");
      });
    });
  });
});

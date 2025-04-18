import { rest } from "msw";

export const handlers = [
  // Mock authentication endpoints
  rest.post("/api/auth/login", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: "mock-jwt-token",
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
        },
      }),
    );
  }),

  // Mock game data endpoints
  rest.get("/api/games", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: "1",
          player1: "Player 1",
          player2: "Player 2",
          score: "8-5",
          timestamp: new Date().toISOString(),
        },
      ]),
    );
  }),

  // Mock venue endpoints
  rest.get("/api/venues", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: "1",
          name: "Test Venue",
          address: "123 Test St",
          tables: 4,
          isActive: true,
        },
      ]),
    );
  }),

  // Mock user profile endpoints
  rest.get("/api/profile", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: "1",
        name: "Test User",
        email: "test@example.com",
        stats: {
          gamesPlayed: 10,
          gamesWon: 7,
          winRate: 0.7,
        },
      }),
    );
  }),
];

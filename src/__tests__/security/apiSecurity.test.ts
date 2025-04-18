import { createServer } from "http";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { validateRequest } from "../../middleware/validation";
import { createRateLimiter } from "../../middleware/rateLimiter";

// API request validation schemas
const userSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
});

const gameSchema = z.object({
  player1: z.string().uuid(),
  player2: z.string().uuid(),
  type: z.enum(["8ball", "9ball", "10ball"]),
  rules: z.object({
    fouls: z.boolean(),
    timeLimit: z.number().min(0).max(3600),
  }),
});

describe("API Security Tests", () => {
  let server: any;
  let rateLimiter: any;

  beforeEach(() => {
    rateLimiter = createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests, please try again later.",
    });
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe("Rate Limiting", () => {
    it("should limit requests from the same IP", async () => {
      const requests = Array(101)
        .fill(null)
        .map(() =>
          fetch("http://localhost:3000/api/games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }),
        );

      const responses = await Promise.all(requests);
      const statusCodes = responses.map((r) => r.status);

      expect(statusCodes.filter((code) => code === 429).length).toBeGreaterThan(
        0,
      );
    });

    it("should reset rate limit after window period", async () => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await fetch("http://localhost:3000/api/games");
      }

      // Wait for rate limit window to reset
      await new Promise((resolve) => setTimeout(resolve, 15 * 60 * 1000));

      // Should be able to make requests again
      const response = await fetch("http://localhost:3000/api/games");
      expect(response.status).toBe(200);
    });
  });

  describe("Input Validation", () => {
    it("should reject invalid user data", async () => {
      const invalidUser = {
        username: "a", // too short
        email: "invalid-email",
        password: "weak",
      };

      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidUser),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.errors).toBeDefined();
    });

    it("should reject invalid game data", async () => {
      const invalidGame = {
        player1: "invalid-uuid",
        player2: "invalid-uuid",
        type: "invalid-type",
        rules: {
          fouls: "not-a-boolean",
          timeLimit: -1,
        },
      };

      const response = await fetch("http://localhost:3000/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidGame),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.errors).toBeDefined();
    });

    it("should sanitize input data", async () => {
      const maliciousInput = {
        username: '<script>alert("xss")</script>',
        email: "test@example.com",
        password: "ValidPass123!",
      };

      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maliciousInput),
      });

      const data = await response.json();
      expect(data.username).not.toContain("<script>");
    });
  });

  describe("Authentication", () => {
    it("should require authentication for protected routes", async () => {
      const response = await fetch("http://localhost:3000/api/users/profile");
      expect(response.status).toBe(401);
    });

    it("should validate JWT tokens", async () => {
      const response = await fetch("http://localhost:3000/api/users/profile", {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });
      expect(response.status).toBe(401);
    });
  });

  describe("CSRF Protection", () => {
    it("should require CSRF token for state-changing requests", async () => {
      const response = await fetch("http://localhost:3000/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status).toBe(403);
    });
  });
});

import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import fetch from "node-fetch";
import { sign } from "jsonwebtoken";
import { rateLimit } from "../../config/rateLimit";
import { jwtConfig } from "../../config/jwt";

describe("API Security Tests", () => {
  const baseUrl = process.env.API_URL || "https://localhost:3000";
  let validToken: string;
  let expiredToken: string;
  let malformedToken: string;

  beforeAll(() => {
    // Generate test tokens
    validToken = sign({ userId: "test-user", role: "user" }, jwtConfig.secret, {
      expiresIn: "1h",
    });
    expiredToken = sign(
      { userId: "test-user", role: "user" },
      jwtConfig.secret,
      { expiresIn: "0s" },
    );
    malformedToken = "invalid.token.format";
  });

  describe("Authentication Security", () => {
    test("should reject requests without authentication", async () => {
      const response = await fetch(`${baseUrl}/api/protected/user-profile`);
      expect(response.status).toBe(401);
    });

    test("should reject expired tokens", async () => {
      const response = await fetch(`${baseUrl}/api/protected/user-profile`, {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });
      expect(response.status).toBe(401);
    });

    test("should reject malformed tokens", async () => {
      const response = await fetch(`${baseUrl}/api/protected/user-profile`, {
        headers: {
          Authorization: `Bearer ${malformedToken}`,
        },
      });
      expect(response.status).toBe(401);
    });

    test("should accept valid tokens", async () => {
      const response = await fetch(`${baseUrl}/api/protected/user-profile`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });
      expect(response.status).toBe(200);
    });
  });

  describe("Authorization Security", () => {
    test("should prevent unauthorized access to admin endpoints", async () => {
      const userToken = sign(
        { userId: "test-user", role: "user" },
        jwtConfig.secret,
        { expiresIn: "1h" },
      );
      const response = await fetch(`${baseUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      expect(response.status).toBe(403);
    });

    test("should allow admin access to admin endpoints", async () => {
      const adminToken = sign(
        { userId: "admin-user", role: "admin" },
        jwtConfig.secret,
        { expiresIn: "1h" },
      );
      const response = await fetch(`${baseUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      expect(response.status).toBe(200);
    });

    test("should prevent unauthorized tournament operations", async () => {
      const response = await fetch(`${baseUrl}/api/tournaments/1/manage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start" }),
      });
      expect(response.status).toBe(403);
    });
  });

  describe("Rate Limiting", () => {
    test("should enforce authentication rate limits", async () => {
      const attempts = rateLimit.auth.maxRequests + 1;
      const requests = Array(attempts)
        .fill(null)
        .map(() =>
          fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "test@example.com",
              password: "password",
            }),
          }),
        );

      const responses = await Promise.all(requests);
      const blockedResponses = responses.filter((r) => r.status === 429);
      expect(blockedResponses.length).toBeGreaterThan(0);
    });

    test("should enforce API rate limits", async () => {
      const attempts = rateLimit.api.maxRequests + 1;
      const requests = Array(attempts)
        .fill(null)
        .map(() =>
          fetch(`${baseUrl}/api/games`, {
            headers: { Authorization: `Bearer ${validToken}` },
          }),
        );

      const responses = await Promise.all(requests);
      const blockedResponses = responses.filter((r) => r.status === 429);
      expect(blockedResponses.length).toBeGreaterThan(0);
    });
  });

  describe("Input Validation", () => {
    test("should reject SQL injection attempts", async () => {
      const response = await fetch(`${baseUrl}/api/users/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "'; DROP TABLE users; --",
        }),
      });
      expect(response.status).toBe(400);
    });

    test("should reject XSS attempts", async () => {
      const response = await fetch(`${baseUrl}/api/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: '<script>alert("XSS")</script>',
        }),
      });
      expect(response.status).toBe(400);
    });

    test("should validate file upload types", async () => {
      const formData = new FormData();
      const fakeFile = new Blob(["fake executable"], {
        type: "application/x-msdownload",
      });
      formData.append("file", fakeFile, "malicious.exe");

      const response = await fetch(`${baseUrl}/api/uploads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
        body: formData,
      });
      expect(response.status).toBe(400);
    });
  });

  describe("Error Handling", () => {
    test("should not expose sensitive information in errors", async () => {
      const response = await fetch(`${baseUrl}/api/users/999999`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      expect(response.status).toBe(404);
      const error = await response.json();
      expect(error).not.toHaveProperty("stack");
      expect(error).not.toHaveProperty("query");
      expect(error).toHaveProperty("message");
    });

    test("should handle invalid JSON gracefully", async () => {
      const response = await fetch(`${baseUrl}/api/games`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
        body: "{invalid json",
      });
      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty("message");
      expect(error.message).not.toMatch(/SyntaxError/);
    });
  });

  describe("CSRF Protection", () => {
    test("should require CSRF token for state-changing operations", async () => {
      const response = await fetch(`${baseUrl}/api/user/settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: "dark" }),
      });
      expect(response.status).toBe(403);
    });

    test("should accept valid CSRF token", async () => {
      // First get CSRF token
      const tokenResponse = await fetch(`${baseUrl}/api/csrf-token`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });
      const { csrfToken } = await tokenResponse.json();

      const response = await fetch(`${baseUrl}/api/user/settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ theme: "dark" }),
      });
      expect(response.status).toBe(200);
    });
  });
});

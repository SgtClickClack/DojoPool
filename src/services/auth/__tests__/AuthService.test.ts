import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AuthService } from "../AuthService";
import { UserService } from "../../database/UserService";
import { User } from "../../../types/user";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("bcryptjs");
jest.mock("../../database/UserService");

describe("AuthService", () => {
  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    password: "hashedPassword",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const mockToken = "mock.jwt.token";
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = AuthService.generateToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        expect.any(String),
        { expiresIn: "24h" },
      );
      expect(token).toBe(mockToken);
    });

    it("should throw error when user data is empty", () => {
      const emptyUser = {} as User;
      expect(() => AuthService.generateToken(emptyUser)).toThrow();
    });

    it("should throw error when user data is invalid", () => {
      const invalidUser = {
        id: "1",
        email: "invalid-email",
        role: "invalid-role",
      } as User;
      expect(() => AuthService.generateToken(invalidUser)).toThrow();
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const mockToken = "valid.token";
      const mockDecoded = { id: "1", email: "test@example.com" };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = AuthService.verifyToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(result).toEqual(mockDecoded);
    });

    it("should throw an error for invalid token", () => {
      const mockToken = "invalid.token";
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      expect(() => AuthService.verifyToken(mockToken)).toThrow("Invalid token");
    });

    it("should throw error for expired token", () => {
      const expiredToken = "expired.token";
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError("Token expired", new Date());
      });

      expect(() => AuthService.verifyToken(expiredToken)).toThrow(
        "Invalid token",
      );
    });

    it("should throw error for malformed token", () => {
      const malformedToken = "malformed.token";
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("Invalid token");
      });

      expect(() => AuthService.verifyToken(malformedToken)).toThrow(
        "Invalid token",
      );
    });
  });

  describe("validateUser", () => {
    it("should return user when credentials are valid", async () => {
      (UserService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.validateUser(
        "test@example.com",
        "password",
      );

      expect(UserService.findUserByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password",
        mockUser.password,
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when user is not found", async () => {
      (UserService.findUserByEmail as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.validateUser(
        "nonexistent@example.com",
        "password",
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return null when password is invalid", async () => {
      (UserService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await AuthService.validateUser(
        "test@example.com",
        "wrongpassword",
      );

      expect(result).toBeNull();
    });

    it("should handle bcrypt comparison error", async () => {
      (UserService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error("Bcrypt error"),
      );

      await expect(
        AuthService.validateUser("test@example.com", "password"),
      ).rejects.toThrow("Bcrypt error");
    });

    it("should handle database error", async () => {
      (UserService.findUserByEmail as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        AuthService.validateUser("test@example.com", "password"),
      ).rejects.toThrow("Database error");
    });
  });

  describe("hashPassword", () => {
    it("should hash password using bcrypt", async () => {
      const password = "password123";
      const hashedPassword = "hashedPassword123";
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await AuthService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it("should handle bcrypt hashing error", async () => {
      const password = "password123";
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hashing error"));

      await expect(AuthService.hashPassword(password)).rejects.toThrow(
        "Hashing error",
      );
    });

    it("should handle empty password", async () => {
      await expect(AuthService.hashPassword("")).rejects.toThrow();
    });
  });

  describe("refreshToken", () => {
    it("should generate a new token for valid user", async () => {
      const oldToken = "old.token";
      const newToken = "new.token";
      const decodedToken = { id: mockUser.id };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (UserService.findUserById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(newToken);

      const result = await AuthService.refreshToken(oldToken);

      expect(jwt.verify).toHaveBeenCalledWith(oldToken, expect.any(String));
      expect(UserService.findUserById).toHaveBeenCalledWith(mockUser.id);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        expect.any(String),
        { expiresIn: "24h" },
      );
      expect(result).toBe(newToken);
    });

    it("should throw error when user is not found", async () => {
      const oldToken = "old.token";
      const decodedToken = { id: "nonexistent" };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (UserService.findUserById as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.refreshToken(oldToken)).rejects.toThrow(
        "User not found",
      );
    });

    it("should handle concurrent token refresh", async () => {
      const oldToken = "old.token";
      const newToken = "new.token";
      const decodedToken = { id: mockUser.id };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (UserService.findUserById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(newToken);

      // Simulate concurrent token refresh
      const results = await Promise.all([
        AuthService.refreshToken(oldToken),
        AuthService.refreshToken(oldToken),
        AuthService.refreshToken(oldToken),
      ]);

      expect(results).toEqual([newToken, newToken, newToken]);
      expect(jwt.verify).toHaveBeenCalledTimes(3);
      expect(UserService.findUserById).toHaveBeenCalledTimes(3);
      expect(jwt.sign).toHaveBeenCalledTimes(3);
    });

    it("should handle token verification error during refresh", async () => {
      const invalidToken = "invalid.token";
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(AuthService.refreshToken(invalidToken)).rejects.toThrow(
        "Invalid token",
      );
    });
  });
});

import { PrismaClient } from "@prisma/client";
import { UserService } from "../UserService";
import { User } from "../../../types/user";

// Mock Prisma client
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe("UserService", () => {
  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    password: "hashedPassword",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.createUser(
        "test@example.com",
        "password123",
      );

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "password123",
        },
      });
      expect(result).toEqual(mockUser);
    });

    it("should handle errors during user creation", async () => {
      const error = new Error("Database error");
      (prisma.user.create as jest.Mock).mockRejectedValue(error);

      await expect(
        UserService.createUser("test@example.com", "password123"),
      ).rejects.toThrow("Database error");
    });
  });

  describe("findUserByEmail", () => {
    it("should find a user by email", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.findUserByEmail("test@example.com");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user is not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await UserService.findUserByEmail(
        "nonexistent@example.com",
      );

      expect(result).toBeNull();
    });
  });

  describe("findUserById", () => {
    it("should find a user by id", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.findUserById("1");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user is not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await UserService.findUserById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("should update a user", async () => {
      const updatedUser = { ...mockUser, email: "updated@example.com" };
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await UserService.updateUser("1", {
        email: "updated@example.com",
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { email: "updated@example.com" },
      });
      expect(result).toEqual(updatedUser);
    });

    it("should handle errors during user update", async () => {
      const error = new Error("Database error");
      (prisma.user.update as jest.Mock).mockRejectedValue(error);

      await expect(
        UserService.updateUser("1", { email: "updated@example.com" }),
      ).rejects.toThrow("Database error");
    });
  });

  describe("deleteUser", () => {
    it("should delete a user", async () => {
      (prisma.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.deleteUser("1");

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should handle errors during user deletion", async () => {
      const error = new Error("Database error");
      (prisma.user.delete as jest.Mock).mockRejectedValue(error);

      await expect(UserService.deleteUser("1")).rejects.toThrow(
        "Database error",
      );
    });
  });
});

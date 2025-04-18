import { PrismaClient } from "@prisma/client";
import { ProfileService } from "../ProfileService";
import { Profile } from "../../../types/profile";

// Mock Prisma client
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe("ProfileService", () => {
  const mockProfile: Profile = {
    userId: "1",
    firstName: "John",
    lastName: "Doe",
    bio: "Test bio",
    avatarUrl: "https://example.com/avatar.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should get a profile by userId", async () => {
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await ProfileService.getProfile("1");

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: "1" },
      });
      expect(result).toEqual(mockProfile);
    });

    it("should return null when profile is not found", async () => {
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await ProfileService.getProfile("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("createProfile", () => {
    it("should create a new profile", async () => {
      const profileData = {
        firstName: "John",
        lastName: "Doe",
        bio: "Test bio",
      };
      (prisma.profile.create as jest.Mock).mockResolvedValue(mockProfile);

      const result = await ProfileService.createProfile("1", profileData);

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          userId: "1",
          ...profileData,
        },
      });
      expect(result).toEqual(mockProfile);
    });

    it("should handle errors during profile creation", async () => {
      const error = new Error("Database error");
      (prisma.profile.create as jest.Mock).mockRejectedValue(error);

      await expect(ProfileService.createProfile("1", {})).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("updateProfile", () => {
    it("should update an existing profile", async () => {
      const updatedData = {
        firstName: "Jane",
        bio: "Updated bio",
      };
      const updatedProfile = { ...mockProfile, ...updatedData };
      (prisma.profile.update as jest.Mock).mockResolvedValue(updatedProfile);

      const result = await ProfileService.updateProfile("1", updatedData);

      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: "1" },
        data: updatedData,
      });
      expect(result).toEqual(updatedProfile);
    });

    it("should handle errors during profile update", async () => {
      const error = new Error("Database error");
      (prisma.profile.update as jest.Mock).mockRejectedValue(error);

      await expect(ProfileService.updateProfile("1", {})).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("deleteProfile", () => {
    it("should delete a profile", async () => {
      (prisma.profile.delete as jest.Mock).mockResolvedValue(mockProfile);

      await ProfileService.deleteProfile("1");

      expect(prisma.profile.delete).toHaveBeenCalledWith({
        where: { userId: "1" },
      });
    });

    it("should handle errors during profile deletion", async () => {
      const error = new Error("Database error");
      (prisma.profile.delete as jest.Mock).mockRejectedValue(error);

      await expect(ProfileService.deleteProfile("1")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("uploadAvatar", () => {
    it("should update profile with new avatar URL", async () => {
      const avatarUrl = "https://example.com/new-avatar.jpg";
      const updatedProfile = { ...mockProfile, avatarUrl };
      (prisma.profile.update as jest.Mock).mockResolvedValue(updatedProfile);

      const result = await ProfileService.uploadAvatar("1", avatarUrl);

      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: "1" },
        data: { avatarUrl },
      });
      expect(result).toEqual(updatedProfile);
    });

    it("should handle errors during avatar upload", async () => {
      const error = new Error("Database error");
      (prisma.profile.update as jest.Mock).mockRejectedValue(error);

      await expect(
        ProfileService.uploadAvatar("1", "invalid-url"),
      ).rejects.toThrow("Database error");
    });
  });
});

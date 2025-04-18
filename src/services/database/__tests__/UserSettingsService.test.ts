import { PrismaClient } from "@prisma/client";
import { UserSettingsService } from "../UserSettingsService";
import { UserSettings } from "../../../types/user";

// Mock Prisma client
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    userSettings: {
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

describe("UserSettingsService", () => {
  const mockSettings: UserSettings = {
    userId: "1",
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    language: "en",
    timezone: "UTC",
    privacySettings: {},
    notificationSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let service: UserSettingsService;
  let prisma: PrismaClient;

  beforeEach(() => {
    service = new UserSettingsService();
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe("getSettings", () => {
    it("should get user settings by userId", async () => {
      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const result = await service.getSettings("1");

      expect(prisma.userSettings.findUnique).toHaveBeenCalledWith({
        where: { userId: "1" },
      });
      expect(result).toEqual(mockSettings);
    });

    it("should return null when settings are not found", async () => {
      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getSettings("nonexistent");

      expect(result).toBeNull();
    });

    it("should handle errors during settings retrieval", async () => {
      const error = new Error("Database error");
      (prisma.userSettings.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(service.getSettings("1")).rejects.toThrow("Database error");
    });
  });

  describe("createSettings", () => {
    it("should create default settings for a user", async () => {
      (prisma.userSettings.create as jest.Mock).mockResolvedValue(mockSettings);

      const result = await service.createSettings("1");

      expect(prisma.userSettings.create).toHaveBeenCalledWith({
        data: {
          userId: "1",
          emailNotifications: true,
          pushNotifications: true,
          darkMode: false,
          language: "en",
          timezone: "UTC",
          privacySettings: {},
          notificationSettings: {},
        },
      });
      expect(result).toEqual(mockSettings);
    });

    it("should handle errors during settings creation", async () => {
      const error = new Error("Database error");
      (prisma.userSettings.create as jest.Mock).mockRejectedValue(error);

      await expect(service.createSettings("1")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("updateSettings", () => {
    it("should update user settings", async () => {
      const updatedData = {
        darkMode: true,
        language: "fr",
      };
      const updatedSettings = { ...mockSettings, ...updatedData };
      (prisma.userSettings.update as jest.Mock).mockResolvedValue(
        updatedSettings,
      );

      const result = await service.updateSettings("1", updatedData);

      expect(prisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: "1" },
        data: updatedData,
      });
      expect(result).toEqual(updatedSettings);
    });

    it("should handle errors during settings update", async () => {
      const error = new Error("Database error");
      (prisma.userSettings.update as jest.Mock).mockRejectedValue(error);

      await expect(service.updateSettings("1", {})).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("deleteSettings", () => {
    it("should delete user settings", async () => {
      (prisma.userSettings.delete as jest.Mock).mockResolvedValue(mockSettings);

      await service.deleteSettings("1");

      expect(prisma.userSettings.delete).toHaveBeenCalledWith({
        where: { userId: "1" },
      });
    });

    it("should handle errors during settings deletion", async () => {
      const error = new Error("Database error");
      (prisma.userSettings.delete as jest.Mock).mockRejectedValue(error);

      await expect(service.deleteSettings("1")).rejects.toThrow(
        "Database error",
      );
    });
  });
});

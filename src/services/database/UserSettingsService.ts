import { PrismaClient } from "@prisma/client";
import { UserSettings } from "../../types/user";

export class UserSettingsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getSettings(userId: string): Promise<UserSettings | null> {
    try {
      return await this.prisma.userSettings.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error("Error fetching user settings:", error);
      throw error;
    }
  }

  async createSettings(userId: string): Promise<UserSettings> {
    try {
      return await this.prisma.userSettings.create({
        data: {
          userId,
          emailNotifications: true,
          pushNotifications: true,
          darkMode: false,
          language: "en",
          timezone: "UTC",
          privacySettings: {},
          notificationSettings: {},
        },
      });
    } catch (error) {
      console.error("Error creating user settings:", error);
      throw error;
    }
  }

  async updateSettings(
    userId: string,
    data: Partial<UserSettings>,
  ): Promise<UserSettings> {
    try {
      return await this.prisma.userSettings.update({
        where: { userId },
        data,
      });
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  }

  async deleteSettings(userId: string): Promise<void> {
    try {
      await this.prisma.userSettings.delete({
        where: { userId },
      });
    } catch (error) {
      console.error("Error deleting user settings:", error);
      throw error;
    }
  }
}

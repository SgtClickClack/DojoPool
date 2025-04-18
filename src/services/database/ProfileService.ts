import { PrismaClient } from "@prisma/client";
import { Profile } from "../../types/profile";

const prisma = new PrismaClient();

export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    return prisma.profile.findUnique({
      where: { userId },
    });
  }

  static async createProfile(
    userId: string,
    data: Partial<Profile>,
  ): Promise<Profile> {
    return prisma.profile.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async updateProfile(
    userId: string,
    data: Partial<Profile>,
  ): Promise<Profile> {
    return prisma.profile.update({
      where: { userId },
      data,
    });
  }

  static async deleteProfile(userId: string): Promise<void> {
    await prisma.profile.delete({
      where: { userId },
    });
  }

  static async uploadAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<Profile> {
    return prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    });
  }
}

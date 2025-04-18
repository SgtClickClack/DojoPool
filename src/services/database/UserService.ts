import { PrismaClient } from "@prisma/client";
import { User } from "../../types/user";

const prisma = new PrismaClient();

export class UserService {
  static async createUser(email: string, password: string): Promise<User> {
    return prisma.user.create({
      data: {
        email,
        password,
      },
    });
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  static async deleteUser(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }
}

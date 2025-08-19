import { Injectable, Logger } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { ErrorUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';

// Simple in-memory fallback store when DB is unavailable
interface FallbackUser extends Omit<User, 'id'> {
  id: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private fallbackUsers: FallbackUser[] = [];
  private idCounter = 1;

  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (err) {
      this.logger.warn(
        `DB create failed, using in-memory store: ${ErrorUtils.getErrorMessage(
          err
        )}`
      );
      const user: FallbackUser = {
        id: this.idCounter++,
        email: (data as any).email,
        username: (data as any).username,
        passwordHash: (data as any).passwordHash,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.fallbackUsers.push(user);
      return user as unknown as User;
    }
  }

  async findAllUsers(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany();
    } catch (err) {
      this.logger.warn(
        `DB findMany failed, returning in-memory users: ${ErrorUtils.getErrorMessage(
          err
        )}`
      );
      return this.fallbackUsers as unknown as User[];
    }
  }
}

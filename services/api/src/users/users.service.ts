import {
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { Cacheable } from '../cache/cache.decorator';
import { CacheService } from '../cache/cache.service';
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

  constructor(
    private _prisma: PrismaService,
    @Optional() private cacheService?: CacheService
  ) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this._prisma.user.create({ data });
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
        isBanned: false,
        avatarUrl: null,
        dojoCoinBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.fallbackUsers.push(user);
      return user as unknown as User;
    }
  }

  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'users',
    keyGenerator: () => 'all_users',
  })
  async findAllUsers(): Promise<User[]> {
    try {
      return await this._prisma.user.findMany();
    } catch (err) {
      this.logger.warn(
        `DB findMany failed, returning in-memory users: ${ErrorUtils.getErrorMessage(
          err
        )}`
      );
      return this.fallbackUsers as unknown as User[];
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      return await this._prisma.user.findUnique({ where: { id } });
    } catch (err) {
      this.logger.warn(
        `DB findUnique failed for user ${id}: ${ErrorUtils.getErrorMessage(err)}`
      );
      const fallbackUser = this.fallbackUsers.find(u => u.id.toString() === id);
      return fallbackUser as unknown as User || null;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this._prisma.user.findUnique({ where: { email } });
    } catch (err) {
      this.logger.warn(
        `DB findUnique failed for email ${email}: ${ErrorUtils.getErrorMessage(err)}`
      );
      const fallbackUser = this.fallbackUsers.find(u => u.email === email);
      return fallbackUser as unknown as User || null;
    }
  }

  async findUserByUsername(username: string): Promise<User | null> {
    try {
      return await this._prisma.user.findUnique({ where: { username } });
    } catch (err) {
      this.logger.warn(
        `DB findUnique failed for username ${username}: ${ErrorUtils.getErrorMessage(err)}`
      );
      const fallbackUser = this.fallbackUsers.find(u => u.username === username);
      return fallbackUser as unknown as User || null;
    }
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await this._prisma.user.update({
        where: { id },
        data,
      });
    } catch (err) {
      this.logger.error(
        `Failed to update user ${id}: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  async deleteUser(id: string): Promise<User> {
    try {
      return await this._prisma.user.delete({
        where: { id },
      });
    } catch (err) {
      this.logger.error(
        `Failed to delete user ${id}: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }
}

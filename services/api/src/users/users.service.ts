import type { Prisma, User } from '@dojopool/prisma';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { CacheInvalidate, Cacheable } from '../cache/cache.decorator';
import { CacheService } from '../cache/cache.service';
import { ErrorUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Type for uploaded file
interface UploadedFile {
  buffer?: Buffer;
  mimetype?: string;
  size?: number;
  path?: string;
}

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
    private prisma: PrismaService,
    @Optional() private cacheService?: CacheService
  ) {
    // Configure Cloudinary once
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  }

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
        email: data.email,
        username: data.username,
        password: data.password,
        role: 'USER',
        isBanned: false,
        dojoCoinBalance: 0,
        totalWins: 0,
        totalLosses: 0,
        winStreak: 0,
        longestWinStreak: 0,
        totalMatches: 0,
        skillRating: 0,
        attributes: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.fallbackUsers.push(user);
      return user as unknown as User;
    }
  }

  async getLeaderboard(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: [
        {
          dojoCoinBalance: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      select: {
        id: true,
        username: true,
        dojoCoinBalance: true,
        profile: {
          select: {
            avatarUrl: true,
          },
        },
      },
    });
    return users;
  }

  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'users',
    keyGenerator: () => 'all_users',
  })
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

  @CacheInvalidate(['users:*'])
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto
  ): Promise<User> {
    try {
      // First check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Update user fields
      const userUpdateData: Prisma.UserUpdateInput = {};
      if (updateProfileDto.username) {
        userUpdateData.username = updateProfileDto.username;
      }

      // Update or create profile
      const profileUpdateData = {
        where: { userId },
        update: {
          bio: updateProfileDto.bio,
          avatarUrl: updateProfileDto.avatarUrl,
          location: updateProfileDto.location,
          displayName: updateProfileDto.displayName,
        },
        create: {
          userId,
          bio: updateProfileDto.bio,
          avatarUrl: updateProfileDto.avatarUrl,
          location: updateProfileDto.location,
          displayName: updateProfileDto.displayName,
        },
      };

      // Use transaction to update both user and profile
      const result = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: userUpdateData,
        }),
        this.prisma.profile.upsert(profileUpdateData),
      ]);

      return result[0] as User;
    } catch (err) {
      this.logger.error(
        `Failed to update profile for user ${userId}: ${ErrorUtils.getErrorMessage(
          err
        )}`
      );
      throw err;
    }
  }

  async uploadAvatar(
    userId: string,
    file: UploadedFile
  ): Promise<{ avatarUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }

    // Optional size limit: 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (typeof file.size === 'number' && file.size > maxSizeBytes) {
      throw new BadRequestException('File too large (max 10MB)');
    }

    // Ensure user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Ensure Cloudinary configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      this.logger.error('Cloudinary environment variables are not set');
      throw new BadRequestException('Image upload service not configured');
    }

    const folder = process.env.CLOUDINARY_FOLDER || 'dojopool/avatars';

    const uploadFromBuffer = (): Promise<UploadApiResponse> => {
      return new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            overwrite: true,
            transformation: [
              {
                width: 256,
                height: 256,
                crop: 'fill',
                gravity: 'face',
                fetch_format: 'auto',
              },
            ],
          },
          (error, result) => {
            if (error || !result)
              return reject(error || new Error('Upload failed'));
            resolve(result);
          }
        );

        if (file.buffer) {
          Readable.from(file.buffer).pipe(upload);
        } else {
          // Fallback to path-based upload if buffer is unavailable
          // This branch should be rare when using memory storage
          cloudinary.uploader
            .upload(file.path!, {
              folder,
              resource_type: 'image',
              overwrite: true,
              transformation: [
                {
                  width: 256,
                  height: 256,
                  crop: 'fill',
                  gravity: 'face',
                  fetch_format: 'auto',
                },
              ],
            })
            .then((res) => resolve(res))
            .catch((err) => reject(err));
        }
      });
    };

    try {
      const result = await uploadFromBuffer();
      const avatarUrl = result.secure_url;

      await this.prisma.profile.upsert({
        where: { userId },
        update: { avatarUrl },
        create: { userId, avatarUrl },
      });

      return { avatarUrl };
    } catch (err) {
      this.logger.error(
        `Avatar upload failed for user ${userId}: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  @Cacheable({ ttl: 60, keyPrefix: 'users:me' })
  async findUserByIdBasic(userId: string): Promise<{
    id: string;
    email: string;
    username: string;
    isAdmin?: boolean;
    role?: string;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.role === 'ADMIN',
      role: user.role,
    };
  }

  async getUserStatistics(userId: string): Promise<{
    id: string;
    username: string;
    totalWins: number;
    totalLosses: number;
    winStreak: number;
    longestWinStreak: number;
    totalMatches: number;
    winRate: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        totalWins: true,
        totalLosses: true,
        winStreak: true,
        longestWinStreak: true,
        totalMatches: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const winRate =
      user.totalMatches > 0 ? (user.totalWins / user.totalMatches) * 100 : 0;

    return {
      id: user.id,
      username: user.username,
      totalWins: user.totalWins,
      totalLosses: user.totalLosses,
      winStreak: user.winStreak,
      longestWinStreak: user.longestWinStreak,
      totalMatches: user.totalMatches,
      winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
    };
  }
}

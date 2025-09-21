import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum, IsUUID, MinLength, MaxLength, IsDateString } from 'class-validator';

/**
 * User role enumeration
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  VENUE_OWNER = 'venue_owner',
}

/**
 * User status enumeration
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
  SUSPENDED = 'suspended',
}

/**
 * Standard user response DTO
 */
export class UserResponseDto {
  @ApiProperty({ description: 'User ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Username' })
  username!: string;

  @ApiProperty({ description: 'Email address' })
  email!: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  role!: UserRole;

  @ApiProperty({ description: 'User status', enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ description: 'Display name', required: false })
  displayName?: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  avatarUrl?: string;

  @ApiProperty({ description: 'Bio/description', required: false })
  bio?: string;

  @ApiProperty({ description: 'Location', required: false })
  location?: string;

  @ApiProperty({ description: 'Date of birth', format: 'date', required: false })
  dateOfBirth?: string;

  @ApiProperty({ description: 'Account creation date', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update date', format: 'date-time' })
  updatedAt!: string;

  @ApiProperty({ description: 'Last login date', format: 'date-time', required: false })
  lastLoginAt?: string;

  @ApiProperty({ description: 'Email verification status' })
  emailVerified!: boolean;

  @ApiProperty({ description: 'Profile completion percentage' })
  profileCompletion!: number;
}

/**
 * User creation DTO
 */
export class CreateUserDto {
  @ApiProperty({ description: 'Username', minLength: 3, maxLength: 32 })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username!: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'Display name', required: false, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @ApiProperty({ description: 'User role', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

/**
 * User update DTO
 */
export class UpdateUserDto {
  @ApiProperty({ description: 'Username', required: false, minLength: 3, maxLength: 32 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Display name', required: false, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @ApiProperty({ description: 'Bio/description', required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ description: 'Location', required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiProperty({ description: 'Date of birth', format: 'date', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

/**
 * User list query DTO
 */
export class UserListQueryDto {
  @ApiProperty({ description: 'Page number', minimum: 1, default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', minimum: 1, maximum: 100, default: 20, required: false })
  @IsOptional()
  pageSize?: number = 20;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by role', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ description: 'Filter by status', enum: UserStatus, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ description: 'Sort field', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * User statistics DTO
 */
export class UserStatsDto {
  @ApiProperty({ description: 'Total users' })
  totalUsers!: number;

  @ApiProperty({ description: 'Active users' })
  activeUsers!: number;

  @ApiProperty({ description: 'New users this month' })
  newUsersThisMonth!: number;

  @ApiProperty({ description: 'Users by role' })
  usersByRole!: Record<UserRole, number>;

  @ApiProperty({ description: 'Users by status' })
  usersByStatus!: Record<UserStatus, number>;
}

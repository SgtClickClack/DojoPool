import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * Clan member roles
 */
export enum ClanMemberRole {
  LEADER = 'leader',
  OFFICER = 'officer',
  MEMBER = 'member',
  RECRUIT = 'recruit',
}

/**
 * Clan status
 */
export enum ClanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISBANDED = 'disbanded',
  SUSPENDED = 'suspended',
}

/**
 * Clan join request status
 */
export enum ClanJoinRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

/**
 * Create clan DTO
 */
export class CreateClanDto {
  @ApiProperty({ description: 'Clan name', minLength: 3, maxLength: 50 })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string;

  @ApiProperty({ description: 'Clan tag', minLength: 2, maxLength: 10 })
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  tag!: string;

  @ApiProperty({ description: 'Clan description', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ description: 'Clan motto', required: false, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  motto?: string;

  @ApiProperty({ description: 'Clan is public', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: 'Clan maximum members',
    required: false,
    minimum: 5,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1000)
  maxMembers?: number;

  @ApiProperty({
    description: 'Clan requirements',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  requirements?: string;

  @ApiProperty({ description: 'Clan avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ description: 'Clan banner URL', required: false })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty({ description: 'Clan metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Join clan DTO
 */
export class JoinClanDto {
  @ApiProperty({ description: 'Join message', required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiProperty({ description: 'Join metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Upgrade dojo DTO
 */
export class UpgradeDojoDto {
  @ApiProperty({ description: 'Upgrade type' })
  @IsString()
  upgradeType!: string;

  @ApiProperty({ description: 'Upgrade level', minimum: 1 })
  @IsInt()
  @Min(1)
  level!: number;

  @ApiProperty({ description: 'Upgrade cost', minimum: 0 })
  @IsInt()
  @Min(0)
  cost!: number;

  @ApiProperty({
    description: 'Upgrade description',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Upgrade metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Clan response DTO
 */
export class ClanResponseDto {
  @ApiProperty({ description: 'Clan ID' })
  id!: string;

  @ApiProperty({ description: 'Clan name' })
  name!: string;

  @ApiProperty({ description: 'Clan tag' })
  tag!: string;

  @ApiProperty({ description: 'Clan description' })
  description!: string;

  @ApiProperty({ description: 'Clan motto', required: false })
  motto?: string;

  @ApiProperty({ description: 'Clan status', enum: ClanStatus })
  status!: ClanStatus;

  @ApiProperty({ description: 'Clan is public' })
  isPublic!: boolean;

  @ApiProperty({ description: 'Clan member count' })
  memberCount!: number;

  @ApiProperty({ description: 'Clan maximum members' })
  maxMembers!: number;

  @ApiProperty({ description: 'Clan requirements', required: false })
  requirements?: string;

  @ApiProperty({ description: 'Clan avatar URL', required: false })
  avatarUrl?: string;

  @ApiProperty({ description: 'Clan banner URL', required: false })
  bannerUrl?: string;

  @ApiProperty({ description: 'Clan leader ID' })
  leaderId!: string;

  @ApiProperty({ description: 'Clan creation date' })
  createdAt!: string;

  @ApiProperty({ description: 'Clan last update date' })
  updatedAt!: string;

  @ApiProperty({ description: 'Clan metadata', required: false })
  metadata?: Record<string, any>;
}

/**
 * Clan member response DTO
 */
export class ClanMemberResponseDto {
  @ApiProperty({ description: 'Member ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Clan ID' })
  clanId!: string;

  @ApiProperty({ description: 'Member role', enum: ClanMemberRole })
  role!: ClanMemberRole;

  @ApiProperty({ description: 'Member join date' })
  joinedAt!: string;

  @ApiProperty({ description: 'Member last activity' })
  lastActivityAt!: string;

  @ApiProperty({ description: 'Member is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Member metadata', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'User information', required: false })
  user?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

/**
 * Clan join request response DTO
 */
export class ClanJoinRequestResponseDto {
  @ApiProperty({ description: 'Request ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Clan ID' })
  clanId!: string;

  @ApiProperty({ description: 'Request status', enum: ClanJoinRequestStatus })
  status!: ClanJoinRequestStatus;

  @ApiProperty({ description: 'Request message', required: false })
  message?: string;

  @ApiProperty({ description: 'Request date' })
  requestedAt!: string;

  @ApiProperty({ description: 'Response date', required: false })
  respondedAt?: string;

  @ApiProperty({ description: 'Response message', required: false })
  responseMessage?: string;

  @ApiProperty({ description: 'Request metadata', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'User information', required: false })
  user?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

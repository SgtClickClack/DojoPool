import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsNumber,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';

/**
 * Cosmetic item categories
 */
export enum CosmeticItemCategory {
  AVATAR = 'avatar',
  CLOTHING = 'clothing',
  ACCESSORY = 'accessory',
  WEAPON = 'weapon',
  VEHICLE = 'vehicle',
  EMOTE = 'emote',
  OTHER = 'other',
}

/**
 * Cosmetic item status
 */
export enum CosmeticItemStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

/**
 * Sort options for cosmetic items
 */
export enum CosmeticItemSortBy {
  NEWEST = 'newest',
  POPULAR = 'popular',
  LIKES = 'likes',
  VIEWS = 'views',
  CREATED_AT = 'created_at',
}

/**
 * Create cosmetic item DTO
 */
export class CreateCosmeticItemDto {
  @ApiProperty({ description: 'Item title', minLength: 3, maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  @ApiProperty({ description: 'Item description', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ description: 'Item category', enum: CosmeticItemCategory })
  @IsEnum(CosmeticItemCategory)
  category!: CosmeticItemCategory;

  @ApiProperty({ description: 'Item metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Item tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * Update cosmetic item DTO
 */
export class UpdateCosmeticItemDto {
  @ApiProperty({
    description: 'Item title',
    required: false,
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @ApiProperty({
    description: 'Item description',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Item category',
    required: false,
    enum: CosmeticItemCategory,
  })
  @IsOptional()
  @IsEnum(CosmeticItemCategory)
  category?: CosmeticItemCategory;

  @ApiProperty({ description: 'Item metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Item tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * Review cosmetic item DTO
 */
export class ReviewCosmeticItemDto {
  @ApiProperty({ description: 'Review status', enum: CosmeticItemStatus })
  @IsEnum(CosmeticItemStatus)
  status!: CosmeticItemStatus;

  @ApiProperty({ description: 'Rejection reason', required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({ description: 'Approved price', required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedPrice?: number;
}

/**
 * Cosmetic item query DTO
 */
export class CosmeticItemQueryDto {
  @ApiProperty({
    description: 'Category filter',
    required: false,
    enum: CosmeticItemCategory,
  })
  @IsOptional()
  @IsEnum(CosmeticItemCategory)
  category?: CosmeticItemCategory;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Sort by',
    required: false,
    enum: CosmeticItemSortBy,
  })
  @IsOptional()
  @IsEnum(CosmeticItemSortBy)
  sortBy?: CosmeticItemSortBy;

  @ApiProperty({
    description: 'Page number',
    required: false,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Admin submissions query DTO
 */
export class AdminSubmissionsQueryDto {
  @ApiProperty({
    description: 'Status filter',
    required: false,
    enum: CosmeticItemStatus,
  })
  @IsOptional()
  @IsEnum(CosmeticItemStatus)
  status?: CosmeticItemStatus;

  @ApiProperty({
    description: 'Category filter',
    required: false,
    enum: CosmeticItemCategory,
  })
  @IsOptional()
  @IsEnum(CosmeticItemCategory)
  category?: CosmeticItemCategory;

  @ApiProperty({ description: 'Creator ID filter', required: false })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Page number',
    required: false,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Bulk approve DTO
 */
export class BulkApproveDto {
  @ApiProperty({ description: 'Item IDs to approve', type: [String] })
  @IsArray()
  @IsString({ each: true })
  itemIds!: string[];

  @ApiProperty({ description: 'Price to set for all items', minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;
}

/**
 * Bulk reject DTO
 */
export class BulkRejectDto {
  @ApiProperty({ description: 'Item IDs to reject', type: [String] })
  @IsArray()
  @IsString({ each: true })
  itemIds!: string[];

  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  reason!: string;
}

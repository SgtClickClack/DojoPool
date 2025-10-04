import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Content types
 */
export enum ContentType {
  POST = 'post',
  ARTICLE = 'article',
  NEWS = 'news',
  EVENT = 'event',
  ANNOUNCEMENT = 'announcement',
  SYSTEM_MESSAGE = 'system_message',
}

/**
 * Content status
 */
export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  HIDDEN = 'hidden',
  MODERATED = 'moderated',
}

/**
 * Content moderation status
 */
export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

/**
 * Create content DTO
 */
export class CreateContentDto {
  @ApiProperty({ description: 'Content title', minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Content body', maxLength: 10000 })
  @IsString()
  @MaxLength(10000)
  body!: string;

  @ApiProperty({ description: 'Content type', enum: ContentType })
  @IsEnum(ContentType)
  type!: ContentType;

  @ApiProperty({ description: 'Content tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Content is public', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Content metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Content images',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Content video URL', required: false })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ description: 'Content link URL', required: false })
  @IsOptional()
  @IsString()
  linkUrl?: string;
}

/**
 * Update content DTO
 */
export class UpdateContentDto {
  @ApiProperty({
    description: 'Content title',
    required: false,
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    description: 'Content body',
    required: false,
    maxLength: 10000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;

  @ApiProperty({
    description: 'Content type',
    required: false,
    enum: ContentType,
  })
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @ApiProperty({ description: 'Content tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Content is public', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Content metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Content images',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Content video URL', required: false })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ description: 'Content link URL', required: false })
  @IsOptional()
  @IsString()
  linkUrl?: string;
}

/**
 * Moderate content DTO
 */
export class ModerateContentDto {
  @ApiProperty({ description: 'Moderation status', enum: ModerationStatus })
  @IsEnum(ModerationStatus)
  status!: ModerationStatus;

  @ApiProperty({
    description: 'Moderation reason',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    description: 'Moderation notes',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ description: 'Moderation metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Create news article DTO
 */
export class CreateNewsArticleDto {
  @ApiProperty({ description: 'Article title', minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Article content', maxLength: 50000 })
  @IsString()
  @MaxLength(50000)
  content!: string;

  @ApiProperty({
    description: 'Article excerpt',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiProperty({ description: 'Article category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Article tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Article featured image', required: false })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiProperty({ description: 'Article is published', required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({
    description: 'Article publish date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @ApiProperty({ description: 'Article metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Create event DTO
 */
export class CreateEventDto {
  @ApiProperty({ description: 'Event title', minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Event description', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ description: 'Event start date', format: 'date-time' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'Event end date', format: 'date-time' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ description: 'Event location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Event venue ID', required: false })
  @IsOptional()
  @IsString()
  venueId?: string;

  @ApiProperty({ description: 'Event category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Event tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Event is public', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Event capacity', required: false, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ description: 'Event price', required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ description: 'Event image', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: 'Event metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Create system message DTO
 */
export class CreateSystemMessageDto {
  @ApiProperty({ description: 'Message title', minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Message content', maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  content!: string;

  @ApiProperty({ description: 'Message type', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Message priority',
    required: false,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiProperty({ description: 'Message is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Message start date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Message end date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Message target audience', required: false })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiProperty({ description: 'Message metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Content filter DTO
 */
export class ContentFilterDto {
  @ApiProperty({
    description: 'Content type filter',
    required: false,
    enum: ContentType,
  })
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @ApiProperty({
    description: 'Content status filter',
    required: false,
    enum: ContentStatus,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiProperty({ description: 'Author ID filter', required: false })
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiProperty({ description: 'Category filter', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Tag filter', required: false })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Date from filter',
    required: false,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Date to filter',
    required: false,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

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

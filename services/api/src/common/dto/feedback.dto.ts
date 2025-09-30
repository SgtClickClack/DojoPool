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
 * Feedback types
 */
export enum FeedbackType {
  BUG_REPORT = 'bug_report',
  FEATURE_REQUEST = 'feature_request',
  GENERAL_FEEDBACK = 'general_feedback',
  COMPLAINT = 'complaint',
  SUGGESTION = 'suggestion',
  PRAISE = 'praise',
}

/**
 * Feedback status
 */
export enum FeedbackStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  DUPLICATE = 'duplicate',
}

/**
 * Feedback priority
 */
export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Create feedback DTO
 */
export class CreateFeedbackDto {
  @ApiProperty({ description: 'Feedback title', minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Feedback description', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ description: 'Feedback type', enum: FeedbackType })
  @IsEnum(FeedbackType)
  type!: FeedbackType;

  @ApiProperty({ description: 'Feedback category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Feedback priority',
    required: false,
    enum: FeedbackPriority,
  })
  @IsOptional()
  @IsEnum(FeedbackPriority)
  priority?: FeedbackPriority;

  @ApiProperty({ description: 'Related entity ID', required: false })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Related entity type', required: false })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ description: 'Feedback is anonymous', required: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({ description: 'Feedback contact email', required: false })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty({ description: 'Feedback metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Update feedback DTO
 */
export class UpdateFeedbackDto {
  @ApiProperty({
    description: 'Feedback title',
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
    description: 'Feedback description',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Feedback type',
    required: false,
    enum: FeedbackType,
  })
  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @ApiProperty({ description: 'Feedback category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Feedback priority',
    required: false,
    enum: FeedbackPriority,
  })
  @IsOptional()
  @IsEnum(FeedbackPriority)
  priority?: FeedbackPriority;

  @ApiProperty({
    description: 'Feedback status',
    required: false,
    enum: FeedbackStatus,
  })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiProperty({
    description: 'Admin response',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminResponse?: string;

  @ApiProperty({ description: 'Feedback metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Feedback filter DTO
 */
export class FeedbackFilterDto {
  @ApiProperty({
    description: 'Feedback type filter',
    required: false,
    enum: FeedbackType,
  })
  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @ApiProperty({
    description: 'Feedback status filter',
    required: false,
    enum: FeedbackStatus,
  })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiProperty({
    description: 'Feedback priority filter',
    required: false,
    enum: FeedbackPriority,
  })
  @IsOptional()
  @IsEnum(FeedbackPriority)
  priority?: FeedbackPriority;

  @ApiProperty({ description: 'Category filter', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Author ID filter', required: false })
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Date from filter', required: false })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({ description: 'Date to filter', required: false })
  @IsOptional()
  @IsString()
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

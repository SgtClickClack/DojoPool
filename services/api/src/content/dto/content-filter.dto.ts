import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

// Define enum values directly to avoid import issues
export enum ContentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export enum ContentType {
  MATCH_REPLAY = 'MATCH_REPLAY',
  CUSTOM_ITEM = 'CUSTOM_ITEM',
  HIGH_SCORE = 'HIGH_SCORE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  TOURNAMENT_HIGHLIGHT = 'TOURNAMENT_HIGHLIGHT',
  VENUE_REVIEW = 'VENUE_REVIEW',
  GENERAL = 'GENERAL',
  EVENT = 'EVENT',
  NEWS_ARTICLE = 'NEWS_ARTICLE',
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE'
}

export enum ContentVisibility {
  PUBLIC = 'PUBLIC',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
  PRIVATE = 'PRIVATE'
}

export class ContentFilterDto {
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value && new Date(value))
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @Transform(({ value }) => value && new Date(value))
  @IsDateString()
  dateTo?: string;
}

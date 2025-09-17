import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Define enum values directly to avoid import issues
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

export class CreateContentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType!: ContentType;

  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

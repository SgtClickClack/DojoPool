import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum NewsCategory {
  GENERAL = 'GENERAL',
  UPDATE = 'UPDATE',
  EVENT = 'EVENT',
  MAINTENANCE = 'MAINTENANCE',
  FEATURE = 'FEATURE',
}

export class CreateNewsItemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(NewsCategory)
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  publishTime?: string;

  @IsOptional()
  @IsDateString()
  expiryTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetPlatform?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

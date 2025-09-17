import { ContentVisibility } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  venueId?: string;

  @IsOptional()
  @IsString()
  maxAttendees?: string;

  @IsOptional()
  @IsString()
  registrationDeadline?: string;

  @IsOptional()
  @IsString()
  eventType?: string; // TOURNAMENT, SOCIAL, MAINTENANCE, etc.

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  visibility?: ContentVisibility;
}

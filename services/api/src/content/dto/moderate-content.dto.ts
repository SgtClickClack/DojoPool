import { ContentStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ModerateContentDto {
  @IsNotEmpty()
  @IsEnum(ContentStatus)
  status: ContentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  moderationNotes?: string;
}

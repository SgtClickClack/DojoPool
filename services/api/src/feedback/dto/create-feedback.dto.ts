import { FeedbackCategory } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsNotEmpty()
  @IsEnum(FeedbackCategory)
  category: FeedbackCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalContext?: string;
}

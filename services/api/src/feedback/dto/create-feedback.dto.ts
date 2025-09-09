import { FeedbackCategory } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, 'Maximum 5 attachments allowed')
  @IsUrl({}, { each: true })
  attachments?: string[];
}

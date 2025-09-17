import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Define enum values directly to avoid import issues
enum FeedbackCategory {
  BUG = 'BUG',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  GENERAL_FEEDBACK = 'GENERAL_FEEDBACK',
  VENUE_ISSUE = 'VENUE_ISSUE',
  TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
  UI_UX_IMPROVEMENT = 'UI_UX_IMPROVEMENT',
  PERFORMANCE_ISSUE = 'PERFORMANCE_ISSUE'
}

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsNotEmpty()
  @IsEnum(FeedbackCategory)
  category!: FeedbackCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalContext?: string;
}

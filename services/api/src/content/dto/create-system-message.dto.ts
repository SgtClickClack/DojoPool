import { ContentVisibility } from '@dojopool/types';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum SystemMessageType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export enum SystemMessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateSystemMessageDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(SystemMessageType)
  messageType?: SystemMessageType;

  @IsOptional()
  @IsEnum(SystemMessagePriority)
  priority?: SystemMessagePriority;

  @IsOptional()
  @IsString()
  expiresAt?: string; // When the message should be automatically hidden

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // Whether the message is currently displayed

  @IsOptional()
  @IsString()
  targetAudience?: string; // ALL_USERS, ADMINS_ONLY, VENUE_OWNERS, etc.

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUserIds?: string[]; // Specific users to show this message to

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

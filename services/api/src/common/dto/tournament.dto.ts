import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * Tournament status
 */
export enum TournamentStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  REGISTRATION_OPEN = 'registration_open',
  REGISTRATION_CLOSED = 'registration_closed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Tournament format
 */
export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss',
  BRACKET = 'bracket',
}

/**
 * Tournament type
 */
export enum TournamentType {
  CASH = 'cash',
  TOKEN = 'token',
  FREE = 'free',
  INVITATIONAL = 'invitational',
}

/**
 * Create tournament DTO
 */
export class CreateTournamentDto {
  @ApiProperty({ description: 'Tournament name', minLength: 3, maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'Tournament description', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ description: 'Tournament format', enum: TournamentFormat })
  @IsEnum(TournamentFormat)
  format!: TournamentFormat;

  @ApiProperty({ description: 'Tournament type', enum: TournamentType })
  @IsEnum(TournamentType)
  type!: TournamentType;

  @ApiProperty({
    description: 'Maximum participants',
    minimum: 2,
    maximum: 1000,
  })
  @IsInt()
  @Min(2)
  @Max(1000)
  maxParticipants!: number;

  @ApiProperty({ description: 'Entry fee', required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @ApiProperty({ description: 'Prize pool', required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prizePool?: number;

  @ApiProperty({ description: 'Start date', format: 'date-time' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Registration start date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  registrationStartDate?: string;

  @ApiProperty({
    description: 'Registration end date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  registrationEndDate?: string;

  @ApiProperty({
    description: 'Tournament rules',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rules?: string;

  @ApiProperty({ description: 'Tournament requirements', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({ description: 'Tournament is public', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Tournament metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Update tournament DTO
 */
export class UpdateTournamentDto {
  @ApiProperty({
    description: 'Tournament name',
    required: false,
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'Tournament description',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Tournament format',
    required: false,
    enum: TournamentFormat,
  })
  @IsOptional()
  @IsEnum(TournamentFormat)
  format?: TournamentFormat;

  @ApiProperty({
    description: 'Tournament type',
    required: false,
    enum: TournamentType,
  })
  @IsOptional()
  @IsEnum(TournamentType)
  type?: TournamentType;

  @ApiProperty({
    description: 'Maximum participants',
    required: false,
    minimum: 2,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(1000)
  maxParticipants?: number;

  @ApiProperty({ description: 'Entry fee', required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @ApiProperty({ description: 'Prize pool', required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prizePool?: number;

  @ApiProperty({
    description: 'Start date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Registration start date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  registrationStartDate?: string;

  @ApiProperty({
    description: 'Registration end date',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  registrationEndDate?: string;

  @ApiProperty({
    description: 'Tournament rules',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rules?: string;

  @ApiProperty({ description: 'Tournament requirements', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({ description: 'Tournament is public', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Tournament metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Start tournament DTO
 */
export class StartTournamentDto {
  @ApiProperty({
    description: 'Tournament start time',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({ description: 'Tournament settings', required: false })
  @IsOptional()
  settings?: Record<string, any>;
}

/**
 * Register for tournament DTO
 */
export class RegisterTournamentDto {
  @ApiProperty({ description: 'Player ID' })
  @IsString()
  playerId!: string;

  @ApiProperty({
    description: 'Registration notes',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ description: 'Registration metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Unregister from tournament DTO
 */
export class UnregisterTournamentDto {
  @ApiProperty({ description: 'Player ID' })
  @IsString()
  playerId!: string;

  @ApiProperty({
    description: 'Unregistration reason',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * Update match DTO
 */
export class UpdateMatchDto {
  @ApiProperty({ description: 'Match status', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Match score', required: false })
  @IsOptional()
  score?: Record<string, any>;

  @ApiProperty({ description: 'Match winner ID', required: false })
  @IsOptional()
  @IsString()
  winnerId?: string;

  @ApiProperty({ description: 'Match duration', required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiProperty({ description: 'Match notes', required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ description: 'Match metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

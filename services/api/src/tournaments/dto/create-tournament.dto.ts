import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, Min } from 'class-validator';

export enum GameTypeEnum {
  EIGHT_BALL = 'EIGHT_BALL',
  NINE_BALL = 'NINE_BALL',
  TEN_BALL = 'TEN_BALL',
}

export enum BracketTypeEnum {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
}

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsEnum(GameTypeEnum)
  gameType?: GameTypeEnum;

  @IsOptional()
  @IsEnum(BracketTypeEnum)
  bracketType?: BracketTypeEnum;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prizePool?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(256)
  maxParticipants?: number;

  // Optionally allow client to pass an initial status (defaults to REGISTRATION)
  @IsOptional()
  @IsString()
  status?: string;
}

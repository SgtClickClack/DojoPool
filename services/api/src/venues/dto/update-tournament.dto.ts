import { IsString, IsOptional, IsDateString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { TournamentFormat } from './create-tournament.dto';

export class UpdateTournamentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsInt()
  @Min(2)
  @Max(64)
  @IsOptional()
  maxPlayers?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  entryFee?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  prizePool?: number;

  @IsEnum(TournamentFormat)
  @IsOptional()
  format?: TournamentFormat;

  @IsString()
  @IsOptional()
  rewards?: string;
}

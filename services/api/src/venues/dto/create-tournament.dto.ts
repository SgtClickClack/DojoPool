import { IsString, IsNotEmpty, IsDateString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SWISS = 'SWISS'
}

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsInt()
  @Min(2)
  @Max(64)
  maxPlayers: number = 8;

  @IsInt()
  @Min(0)
  entryFee: number = 0;

  @IsInt()
  @Min(0)
  prizePool: number = 0;

  @IsEnum(TournamentFormat)
  @IsOptional()
  format: TournamentFormat = TournamentFormat.SINGLE_ELIMINATION;

  @IsString()
  @IsOptional()
  rewards?: string;
}

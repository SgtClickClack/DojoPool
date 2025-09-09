import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class PlayerInsightsSummaryDto {
  @IsString()
  playerId: string;

  @IsString()
  summary: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  };

  @IsOptional()
  trends?: {
    recentPerformance: number[];
    skillProgression: number[];
    venuePerformance: Record<string, number>;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasForImprovement?: string[];
}

export class PlayerPerformanceMetricsDto {
  @IsString()
  playerId: string;

  @IsString()
  matchId: string;

  @IsNumber()
  accuracy: number;

  @IsNumber()
  consistency: number;

  @IsNumber()
  positioning: number;

  @IsNumber()
  strategy: number;

  @IsNumber()
  mentalGame: number;

  @IsNumber()
  overallRating: number;

  @IsOptional()
  keyShots?: any[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mistakes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];
}

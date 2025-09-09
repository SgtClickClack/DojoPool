import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class MatchInsightsDto {
  @IsString()
  id: string;

  @IsString()
  matchId: string;

  @IsString()
  provider: string;

  @IsBoolean()
  fallback: boolean;

  @IsArray()
  @IsString({ each: true })
  keyMoments: string[];

  @IsArray()
  @IsString({ each: true })
  strategicInsights: string[];

  @IsOptional()
  @IsString()
  playerPerformanceA?: string | null;

  @IsOptional()
  @IsString()
  playerPerformanceB?: string | null;

  @IsOptional()
  @IsString()
  overallAssessment?: string | null;

  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
}

export class MatchInsightsResponseDto extends MatchInsightsDto {
  @IsOptional()
  match?: {
    id: string;
    scoreA: number | null;
    scoreB: number | null;
    winnerId: string | null;
    tournament?: {
      name: string;
    };
    venue?: {
      name: string;
    };
    playerA?: {
      username: string;
    };
    playerB?: {
      username: string;
    };
  };
}

import { IsOptional, IsString } from 'class-validator';

export class JoinTournamentDto {
  @IsOptional()
  @IsString()
  paymentMethod?: string; // For future payment integration

  @IsOptional()
  @IsString()
  notes?: string; // Optional notes from participant
}

import { IsBoolean, IsOptional } from 'class-validator';

export class StartTournamentDto {
  @IsBoolean()
  @IsOptional()
  shuffleParticipants?: boolean = true;
}

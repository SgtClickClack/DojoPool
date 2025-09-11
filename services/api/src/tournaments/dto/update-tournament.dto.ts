import { PartialType } from '@nestjs/mapped-types';
import { TournamentStatus } from '@dojopool/prisma';
import { IsIn, IsOptional } from 'class-validator';
import { CreateTournamentDto } from './create-tournament.dto';

const TOURNAMENT_STATUS_VALUES = [
  'UPCOMING',
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export class UpdateTournamentDto extends PartialType(CreateTournamentDto) {
  @IsOptional()
  @IsIn(TOURNAMENT_STATUS_VALUES)
  status?: TournamentStatus;
}

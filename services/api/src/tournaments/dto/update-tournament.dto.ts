import { PartialType } from '@nestjs/mapped-types';
import { TournamentStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTournamentDto } from './create-tournament.dto';

export class UpdateTournamentDto extends PartialType(CreateTournamentDto) {
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;
}

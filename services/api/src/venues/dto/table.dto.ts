import { IsOptional, IsString } from 'class-validator';

// DTOs for venue tables. Extracted from controller to align with docs/tasks.md Task 7
// and enable validation via class-validator. These are simple string fields for now;
// expand with enums or stricter schemas as domain evolves.

export class CreateTableDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateTableInfoDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateTableDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  matchId?: string;
}

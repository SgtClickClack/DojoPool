import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateIf } from 'class-validator';

export class UpdateMatchDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  player1Score!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  player2Score!: number;

  // Winner is optional if scores are not equal; if provided, must be a valid UUID
  @IsOptional()
  @IsString()
  @IsUUID()
  winnerId?: string;
}

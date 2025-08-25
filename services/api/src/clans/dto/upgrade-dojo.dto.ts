import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class UpgradeDojoDto {
  @IsIn(['income', 'defense'])
  type!: 'income' | 'defense';

  @IsOptional()
  @IsInt()
  @Min(1)
  levels?: number;
}

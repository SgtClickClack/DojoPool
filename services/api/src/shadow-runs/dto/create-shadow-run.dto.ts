import { IsIn, IsString } from 'class-validator';

export type ShadowRunType = 'DATA_HEIST' | 'SABOTAGE';

export class CreateShadowRunDto {
  @IsString()
  targetVenueId!: string;

  @IsIn(['DATA_HEIST', 'SABOTAGE'])
  runType!: ShadowRunType;
}

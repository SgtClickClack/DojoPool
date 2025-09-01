import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  challengerId!: string;

  @IsString()
  defenderId!: string;

  @IsNumber()
  @IsOptional()
  stakeCoins?: number;
}

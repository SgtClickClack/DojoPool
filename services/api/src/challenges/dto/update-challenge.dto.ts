import { IsEnum } from 'class-validator';

export enum ChallengeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export class UpdateChallengeDto {
  @IsEnum(ChallengeStatus)
  status!: ChallengeStatus;
}

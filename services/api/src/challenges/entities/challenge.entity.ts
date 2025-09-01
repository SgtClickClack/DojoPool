export enum ChallengeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export interface Challenge {
  id: string;
  challengerId: string;
  defenderId: string;
  status: ChallengeStatus;
  stakeCoins: number;
  createdAt: string;
  updatedAt: string;
}

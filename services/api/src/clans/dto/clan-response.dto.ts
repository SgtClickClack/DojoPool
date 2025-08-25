export class ClanMemberResponseDto {
  id!: string;
  userId!: string;
  role!: string;
  joinedAt!: Date;
  user!: {
    id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatarUrl?: string;
    };
  };
}

export class ClanResponseDto {
  id!: string;
  name!: string;
  tag?: string;
  description?: string;
  leaderId!: string;
  leader!: {
    id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatarUrl?: string;
    };
  };
  memberCount?: number;
  members?: ClanMemberResponseDto[];
  // New: venues this clan currently controls
  controlledVenues?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
  createdAt!: Date;
  updatedAt!: Date;
}

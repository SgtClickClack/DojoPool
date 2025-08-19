export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  blockedAt?: string;
}

export interface FriendRequestCreate {
  addresseeId: string;
}

export interface FriendRequestUpdate {
  status: 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
}

export interface Friend {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  skillLevel: number;
  friendshipId: string;
  friendshipCreatedAt: string;
}

export interface FriendRequestResponse {
  id: string;
  requester: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
    skillLevel: number;
  };
  status: string;
  createdAt: string;
}

export interface FriendsListResponse {
  friends: Friend[];
  pendingRequests: FriendRequestResponse[];
  totalFriends: number;
  totalPendingRequests: number;
}

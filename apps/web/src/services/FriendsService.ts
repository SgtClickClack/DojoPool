import {
  FriendRequest,
  FriendRequestCreate,
  FriendRequestUpdate,
  FriendsListResponse,
} from '../types/friends';

export class FriendsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Unknown error' }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  async sendFriendRequest(
    request: FriendRequestCreate
  ): Promise<FriendRequest> {
    return this.request<FriendRequest>('/friends/requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    return this.request<FriendRequest[]>('/friends/requests');
  }

  async updateFriendRequest(
    requestId: string,
    update: FriendRequestUpdate
  ): Promise<FriendRequest> {
    return this.request<FriendRequest>(`/friends/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  }

  async getFriends(): Promise<FriendsListResponse> {
    return this.request<FriendsListResponse>('/friends');
  }

  async removeFriend(friendshipId: string): Promise<void> {
    return this.request<void>(`/friends/${friendshipId}`, {
      method: 'DELETE',
    });
  }

  async blockUser(userId: string): Promise<void> {
    return this.request<void>(`/friends/block/${userId}`, {
      method: 'POST',
    });
  }

  async unblockUser(userId: string): Promise<void> {
    return this.request<void>(`/friends/unblock/${userId}`, {
      method: 'POST',
    });
  }
}

export const friendsService = new FriendsService();

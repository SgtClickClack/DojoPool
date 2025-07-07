import { io, Socket } from 'socket.io-client';

export interface Friend {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game';
  lastSeen: Date;
  clan?: string;
  rank: string;
  territoryCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'challenge' | 'clan-invite' | 'tournament-invite';
  read: boolean;
  metadata?: any;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  type: 'match-win' | 'territory-capture' | 'tournament-win' | 'achievement' | 'clan-join' | 'rank-up';
  content: string;
  timestamp: Date;
  metadata?: any;
  likes: number;
  comments: number;
}

export interface SocialProfile {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  clan?: string;
  rank: string;
  territoryCount: number;
  matchWins: number;
  tournamentWins: number;
  achievements: string[];
  followers: number;
  following: number;
  isOnline: boolean;
  lastSeen: Date;
}

export class SocialFeaturesService {
  private socket: Socket | null = null;
  private friends: Friend[] = [];
  private messages: Message[] = [];
  private activityFeed: ActivityFeedItem[] = [];
  private onlineUsers: Set<string> = new Set();
  private messageCallbacks: ((message: Message) => void)[] = [];
  private friendUpdateCallbacks: ((friend: Friend) => void)[] = [];
  private activityCallbacks: ((activity: ActivityFeedItem) => void)[] = [];

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    this.socket = io('http://localhost:8080');
    
    this.socket.on('connect', () => {
      console.log('Social features connected');
    });

    this.socket.on('friend-online', (friendId: string) => {
      this.updateFriendStatus(friendId, 'online');
    });

    this.socket.on('friend-offline', (friendId: string) => {
      this.updateFriendStatus(friendId, 'offline');
    });

    this.socket.on('new-message', (message: Message) => {
      this.messages.push(message);
      this.messageCallbacks.forEach(callback => callback(message));
    });

    this.socket.on('new-activity', (activity: ActivityFeedItem) => {
      this.activityFeed.unshift(activity);
      this.activityCallbacks.forEach(callback => callback(activity));
    });

    this.socket.on('friend-request', (request: any) => {
      // Handle friend request
      console.log('Friend request received:', request);
    });
  }

  // Friend System
  async getFriends(): Promise<Friend[]> {
    try {
      const response = await fetch('/api/v1/social/friends');
      const data = await response.json();
      this.friends = data.friends;
      return this.friends;
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  }

  async sendFriendRequest(userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/social/friend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  }

  async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/social/friend-request/${requestId}/accept`, {
        method: 'POST'
      });
      if (response.ok) {
        await this.getFriends(); // Refresh friends list
      }
      return response.ok;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  }

  async removeFriend(friendId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/social/friends/${friendId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        this.friends = this.friends.filter(f => f.id !== friendId);
      }
      return response.ok;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  }

  private updateFriendStatus(friendId: string, status: 'online' | 'offline' | 'in-game') {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      friend.status = status;
      friend.lastSeen = new Date();
      this.friendUpdateCallbacks.forEach(callback => callback(friend));
    }
  }

  // Messaging System
  async getMessages(userId: string): Promise<Message[]> {
    try {
      const response = await fetch(`/api/v1/social/messages/${userId}`);
      const data = await response.json();
      this.messages = data.messages;
      return this.messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(receiverId: string, content: string, type: Message['type'] = 'text', metadata?: any): Promise<boolean> {
    try {
      const message = {
        receiverId,
        content,
        type,
        metadata
      };

      const response = await fetch('/api/v1/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        const newMessage = await response.json();
        this.messages.push(newMessage);
        this.messageCallbacks.forEach(callback => callback(newMessage));
      }

      return response.ok;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/social/messages/${messageId}/read`, {
        method: 'PUT'
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  // Activity Feed
  async getActivityFeed(page: number = 1, limit: number = 20): Promise<ActivityFeedItem[]> {
    try {
      const response = await fetch(`/api/v1/social/activity-feed?page=${page}&limit=${limit}`);
      const data = await response.json();
      if (page === 1) {
        this.activityFeed = data.activities;
      } else {
        this.activityFeed.push(...data.activities);
      }
      return data.activities;
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }
  }

  async likeActivity(activityId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/social/activity/${activityId}/like`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Error liking activity:', error);
      return false;
    }
  }

  async commentOnActivity(activityId: string, comment: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/social/activity/${activityId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
      });
      return response.ok;
    } catch (error) {
      console.error('Error commenting on activity:', error);
      return false;
    }
  }

  // Social Profiles
  async getProfile(userId: string): Promise<SocialProfile | null> {
    try {
      const response = await fetch(`/api/v1/social/profile/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  async updateProfile(profile: Partial<SocialProfile>): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/social/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  async followUser(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/social/follow/${userId}`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  async unfollowUser(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/social/follow/${userId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  // Event Listeners
  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback);
  }

  onFriendUpdate(callback: (friend: Friend) => void) {
    this.friendUpdateCallbacks.push(callback);
  }

  onActivity(callback: (activity: ActivityFeedItem) => void) {
    this.activityCallbacks.push(callback);
  }

  // Utility Methods
  getUnreadMessageCount(): number {
    return this.messages.filter(m => !m.read).length;
  }

  getOnlineFriends(): Friend[] {
    return this.friends.filter(f => f.status === 'online');
  }

  searchUsers(query: string): Promise<SocialProfile[]> {
    return fetch(`/api/v1/social/search?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => data.users)
      .catch(error => {
        console.error('Error searching users:', error);
        return [];
      });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socialFeaturesService = new SocialFeaturesService(); 
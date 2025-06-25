import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { Profile } from '../../types/profile';

// Define the base URL for social related API calls
const SOCIAL_API_BASE_URL = process.env.REACT_APP_SOCIAL_API_BASE_URL || '/api/social';

export interface User {
  id: number;
  username: string;
  avatar?: string;
  bio?: string;
  social_status?: string;
  last_seen?: string;
}

export interface Friendship {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
  sender: User;
  receiver: User;
}

export interface EnemyRelationship {
  id: number;
  user_id: number;
  enemy_id: number;
  reason?: string;
  created_at: string;
  updated_at: string;
  user: User;
  enemy: User;
}

export interface Clan {
  id: number;
  name: string;
  tag: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  home_venue_id?: number;
  created_at: string;
  updated_at: string;
  member_count: number;
  home_venue?: any;
}

export interface ClanMember {
  id: number;
  clan_id: number;
  user_id: number;
  role: 'leader' | 'officer' | 'member' | 'recruit';
  contribution_points: number;
  joined_at: string;
  last_active: string;
  user: User;
}

export interface ClanStats {
  id: number;
  clan_id: number;
  total_matches: number;
  matches_won: number;
  tournaments_won: number;
  total_contribution: number;
  weekly_points: number;
  monthly_points: number;
  win_rate: number;
  updated_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender: User;
  receiver: User;
}

export interface SocialEvent {
  type: 'friend_request' | 'friend_accepted' | 'friend_rejected' | 'enemy_added' | 'clan_invite' | 'message_received';
  data: any;
  timestamp: string;
}

export class SocialService extends EventEmitter {
  private socket: Socket | null = null;
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8080') {
    super();
    this.baseUrl = baseUrl;
  }

  // Connection Management
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authToken = token;
      this.socket = io(this.baseUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to social service');
        this.emit('connected');
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from social service');
        this.emit('disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Social service error:', error);
        this.emit('error', error);
        reject(error);
      });

      // Social event listeners
      this.socket.on('friend_request', (data) => {
        this.emit('friend_request', data);
      });

      this.socket.on('friend_accepted', (data) => {
        this.emit('friend_accepted', data);
      });

      this.socket.on('friend_rejected', (data) => {
        this.emit('friend_rejected', data);
      });

      this.socket.on('enemy_added', (data) => {
        this.emit('enemy_added', data);
      });

      this.socket.on('clan_invite', (data) => {
        this.emit('clan_invite', data);
      });

      this.socket.on('message_received', (data) => {
        this.emit('message_received', data);
      });

      this.socket.on('clan_update', (data) => {
        this.emit('clan_update', data);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Friend Management
  async sendFriendRequest(receiverId: number): Promise<{ success: boolean; message?: string; friendship?: Friendship }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ receiver_id: receiverId })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, message: 'Failed to send friend request' };
    }
  }

  async acceptFriendRequest(friendshipId: number): Promise<{ success: boolean; message?: string; friendship?: Friendship }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friends/${friendshipId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return { success: false, message: 'Failed to accept friend request' };
    }
  }

  async rejectFriendRequest(friendshipId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friends/${friendshipId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return { success: false, message: 'Failed to reject friend request' };
    }
  }

  async blockUser(userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friends/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error blocking user:', error);
      return { success: false, message: 'Failed to block user' };
    }
  }

  async getFriends(status?: 'pending' | 'accepted' | 'rejected' | 'blocked'): Promise<Friendship[]> {
    try {
      const url = status 
        ? `${this.baseUrl}/api/social/friends?status=${status}`
        : `${this.baseUrl}/api/social/friends`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data.friendships || [];
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  }

  async removeFriend(friendshipId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, message: 'Failed to remove friend' };
    }
  }

  // Enemy Management
  async addEnemy(enemyId: number, reason?: string): Promise<{ success: boolean; message?: string; enemy?: EnemyRelationship }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/enemies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ enemy_id: enemyId, reason })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding enemy:', error);
      return { success: false, message: 'Failed to add enemy' };
    }
  }

  async getEnemies(): Promise<EnemyRelationship[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/enemies`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data.enemies || [];
    } catch (error) {
      console.error('Error getting enemies:', error);
      return [];
    }
  }

  async removeEnemy(enemyId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/enemies/${enemyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error removing enemy:', error);
      return { success: false, message: 'Failed to remove enemy' };
    }
  }

  // Clan Management
  async createClan(name: string, tag: string, description?: string, homeVenueId?: number): Promise<{ success: boolean; message?: string; clan?: Clan }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/clans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ name, tag, description, home_venue_id: homeVenueId })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating clan:', error);
      return { success: false, message: 'Failed to create clan' };
    }
  }

  async getClans(): Promise<Clan[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/clans`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data.clans || [];
    } catch (error) {
      console.error('Error getting clans:', error);
      return [];
    }
  }

  async getClan(clanId: number): Promise<Clan | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/clans/${clanId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data.clan || null;
    } catch (error) {
      console.error('Error getting clan:', error);
      return null;
    }
  }

  async joinClan(clanId: number): Promise<{ success: boolean; message?: string; member?: ClanMember }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/clans/${clanId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error joining clan:', error);
      return { success: false, message: 'Failed to join clan' };
    }
  }

  async leaveClan(clanId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/clans/${clanId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error leaving clan:', error);
      return { success: false, message: 'Failed to leave clan' };
    }
  }

  async getClanMembers(clanId: number): Promise<ClanMember[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/clans/${clanId}/members`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data.members || [];
    } catch (error) {
      console.error('Error getting clan members:', error);
      return [];
    }
  }

  async getClanStats(clanId: number): Promise<ClanStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/clans/${clanId}/stats`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data.stats || null;
    } catch (error) {
      console.error('Error getting clan stats:', error);
      return null;
    }
  }

  async updateClanRole(clanId: number, memberId: number, role: 'leader' | 'officer' | 'member' | 'recruit'): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/clans/${clanId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating clan role:', error);
      return { success: false, message: 'Failed to update clan role' };
    }
  }

  async removeClanMember(clanId: number, memberId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/clans/${clanId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error removing clan member:', error);
      return { success: false, message: 'Failed to remove clan member' };
    }
  }

  // Messaging
  async sendMessage(receiverId: number, content: string): Promise<{ success: boolean; message?: string; message_data?: Message }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ receiver_id: receiverId, content })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, message: 'Failed to send message' };
    }
  }

  async getMessages(userId: number, limit: number = 50): Promise<Message[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/messages/${userId}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async markMessageAsRead(messageId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, message: 'Failed to mark message as read' };
    }
  }

  // User Search and Discovery
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async getFriendSuggestions(limit: number = 10): Promise<User[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social/users/suggestions?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting friend suggestions:', error);
      return [];
    }
  }

  // Real-time Updates
  updateSocialStatus(status: 'online' | 'offline' | 'away' | 'busy'): void {
    if (this.socket) {
      this.socket.emit('update_social_status', { status });
    }
  }

  // Utility Methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default SocialService; 
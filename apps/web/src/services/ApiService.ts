import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  status: 'REGISTRATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  tournamentType: string;
  gameType: string;
  venueId: string;
  maxParticipants: number;
  entryFee: number;
  startDate?: string;
  endDate?: string;
  participants: TournamentParticipant[];
  matches: Match[];
  createdAt: string;
  updatedAt: string;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  joinedAt: string;
  status: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface Match {
  id: string;
  tournamentId?: string;
  venueId: string;
  playerAId: string;
  playerBId: string;
  winnerId?: string;
  loserId?: string;
  scoreA: number;
  scoreB: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  round?: number;
  startedAt?: string;
  endedAt?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    skillRating: number;
  };
}

export interface Venue {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    skillRating: number;
    bio?: string;
    location?: string;
    joinDate?: string;
  };
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    totalTournaments: number;
    tournamentWins: number;
    highestFinish: number;
    currentStreak: number;
    longestStreak: number;
  };
}

// API Service Class
class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(
          `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(
          `✅ API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        console.error(
          '❌ API Response Error:',
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );

    // Initialize auth state
    this.initializeAuth();
  }

  // Tournament Management
  async getTournaments(): Promise<Tournament[]> {
    try {
      const response = await this.api.get('/v1/tournaments');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
      throw error;
    }
  }

  async getTournamentById(id: string): Promise<Tournament> {
    try {
      const response = await this.api.get(`/v1/tournaments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch tournament ${id}:`, error);
      throw error;
    }
  }

  async getTournamentDetails(tournamentId: string): Promise<Tournament> {
    try {
      const response = await this.api.get(`/v1/tournaments/${tournamentId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch tournament details for ${tournamentId}:`,
        error
      );
      throw error;
    }
  }

  async createTournament(
    tournamentData: Partial<Tournament>
  ): Promise<Tournament> {
    try {
      const response = await this.api.post('/v1/tournaments', tournamentData);
      return response.data;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      throw error;
    }
  }

  async createVenueTournament(
    venueId: string,
    tournamentData: Partial<Tournament>
  ): Promise<Tournament> {
    try {
      const response = await this.api.post(
        `/v1/venues/${venueId}/tournaments`,
        tournamentData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create venue tournament:', error);
      throw error;
    }
  }

  async updateTournament(
    id: string,
    updates: Partial<Tournament>
  ): Promise<Tournament> {
    try {
      const response = await this.api.patch(`/v1/tournaments/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update tournament ${id}:`, error);
      throw error;
    }
  }

  async deleteTournament(id: string): Promise<void> {
    try {
      await this.api.delete(`/v1/tournaments/${id}`);
    } catch (error) {
      console.error(`Failed to delete tournament ${id}:`, error);
      throw error;
    }
  }

  async joinTournament(tournamentId: string): Promise<void> {
    try {
      await this.api.post(`/v1/tournaments/${tournamentId}/join`);
    } catch (error) {
      console.error(`Failed to join tournament ${tournamentId}:`, error);
      throw error;
    }
  }

  async leaveTournament(tournamentId: string): Promise<void> {
    try {
      await this.api.delete(`/v1/tournaments/${tournamentId}/leave`);
    } catch (error) {
      console.error(`Failed to leave tournament ${tournamentId}:`, error);
      throw error;
    }
  }

  // Match Management
  async getMatches(): Promise<Match[]> {
    try {
      const response = await this.api.get('/v1/matches');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      throw error;
    }
  }

  async getMatchById(id: string): Promise<Match> {
    try {
      const response = await this.api.get(`/v1/matches/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch match ${id}:`, error);
      throw error;
    }
  }

  async createMatch(matchData: Partial<Match>): Promise<Match> {
    try {
      const response = await this.api.post('/v1/matches', matchData);
      return response.data;
    } catch (error) {
      console.error('Failed to create match:', error);
      throw error;
    }
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match> {
    try {
      const response = await this.api.patch(`/v1/matches/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update match ${id}:`, error);
      throw error;
    }
  }

  async deleteMatch(id: string): Promise<void> {
    try {
      await this.api.delete(`/v1/matches/${id}`);
    } catch (error) {
      console.error(`Failed to delete match ${id}:`, error);
      throw error;
    }
  }

  // Venue Management
  async getVenues(): Promise<Venue[]> {
    try {
      const response = await this.api.get('/v1/venues');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      throw error;
    }
  }

  async getVenueById(id: string): Promise<Venue> {
    try {
      const response = await this.api.get(`/v1/venues/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch venue ${id}:`, error);
      throw error;
    }
  }

  async createVenue(venueData: Partial<Venue>): Promise<Venue> {
    try {
      const response = await this.api.post('/v1/venues', venueData);
      return response.data;
    } catch (error) {
      console.error('Failed to create venue:', error);
      throw error;
    }
  }

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue> {
    try {
      const response = await this.api.patch(`/v1/venues/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update venue ${id}:`, error);
      throw error;
    }
  }

  async deleteVenue(id: string): Promise<void> {
    try {
      await this.api.delete(`/v1/venues/${id}`);
    } catch (error) {
      console.error(`Failed to delete venue ${id}:`, error);
      throw error;
    }
  }

  // User Management
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.api.get('/v1/users');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const response = await this.api.get(`/v1/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await this.api.patch(`/v1/users/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.api.delete(`/v1/users/${id}`);
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  }

  // Player Profile Management
  async getPlayerProfile(userId: string): Promise<PlayerProfile> {
    try {
      const response = await this.api.get(`/v1/players/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch player profile for ${userId}:`, error);
      throw error;
    }
  }

  async updatePlayerProfile(
    userId: string,
    updates: Partial<PlayerProfile>
  ): Promise<PlayerProfile> {
    try {
      const response = await this.api.patch(
        `/v1/players/${userId}/profile`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update player profile for ${userId}:`, error);
      throw error;
    }
  }

  // Friend Management
  async sendFriendRequest(
    addresseeId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post('/v1/friends/requests', {
        addresseeId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  }

  async respondToFriendRequest(
    requestId: string,
    status: 'ACCEPTED' | 'DECLINED'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.patch(
        `/v1/friends/requests/${requestId}`,
        {
          status,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
      throw error;
    }
  }

  async getFriends(): Promise<{ friends: any[]; totalFriends: number }> {
    try {
      const response = await this.api.get('/v1/friends');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      throw error;
    }
  }

  async getPendingRequests(): Promise<any[]> {
    try {
      const response = await this.api.get('/v1/friends/requests');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      throw error;
    }
  }

  async getFriendshipStatus(
    userId: string
  ): Promise<{ status: string; requestId?: string }> {
    try {
      const response = await this.api.get(`/v1/friends/status/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch friendship status:', error);
      throw error;
    }
  }

  async getTerritories(): Promise<
    {
      id: string;
      name: string;
      coordinates: [number, number];
      controllingPlayerId?: string;
      controllingPlayerName?: string;
      controllingPlayerAvatar?: string;
      clan?: string;
      level: number;
      isActive: boolean;
    }[]
  > {
    try {
      const response = await this.api.get('/v1/territories');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch territories:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
  }): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const response = await this.api.post('/v1/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; message: string; token: string; user: any }> {
    try {
      const response = await this.api.post('/v1/auth/login', credentials);
      const { token, user } = response.data;

      // Store token in localStorage (you might want to use httpOnly cookies in production)
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Set default authorization header for future requests
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return response.data;
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }

      // Remove authorization header
      delete this.api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const response = await this.api.get('/v1/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  // Initialize auth state from localStorage
  initializeAuth(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');

      if (token && user) {
        this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

import axiosInstance from './axiosInstance';

// Season types
export interface Season {
  id: string;
  name: string;
  theme: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'upcoming' | 'active' | 'ended';
  createdAt: string;
  updatedAt: string;
}

export interface ClanSeasonalStats {
  clanId: string;
  clanName: string;
  clanTag: string;
  seasonalPoints: number;
  rank: number;
  totalMatches: number;
  wonMatches: number;
  territoriesControlled: number;
  members: number;
  avatarUrl?: string;
}

export interface SeasonalLeaderboard {
  seasonId: string;
  seasonName: string;
  clans: ClanSeasonalStats[];
  lastUpdated: string;
}

// Get the currently active season
export const getActiveSeason = async (): Promise<Season | null> => {
  try {
    const res = await axiosInstance.get('/v1/seasons/active');
    return res.data as Season;
  } catch (error) {
    // If no active season, return null
    console.log('No active season found:', error);
    return null;
  }
};

// Get seasonal clan leaderboard for active season
export const getSeasonalClanLeaderboard = async (
  limit: number = 10
): Promise<SeasonalLeaderboard | null> => {
  try {
    const res = await axiosInstance.get(
      `/v1/seasons/leaderboard?limit=${limit}`
    );
    return res.data as SeasonalLeaderboard;
  } catch (error) {
    console.error('Error fetching seasonal leaderboard:', error);
    return null;
  }
};

// Get all seasons (past and future)
export const getAllSeasons = async (): Promise<Season[]> => {
  try {
    const res = await axiosInstance.get('/v1/seasons');
    return res.data as Season[];
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return [];
  }
};

// Get a specific season by ID
export const getSeasonById = async (id: string): Promise<Season | null> => {
  try {
    const res = await axiosInstance.get(`/v1/seasons/${id}`);
    return res.data as Season;
  } catch (error) {
    console.error('Error fetching season:', error);
    return null;
  }
};

import axiosInstance from './axiosInstance';

export interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  totalPoints: number;
}

export const getUserStats = async (): Promise<UserStats> => {
  try {
    const response = await axiosInstance.get('/api/user/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageScore: 0,
      totalPoints: 0,
    };
  }
};

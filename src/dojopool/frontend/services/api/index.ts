export { default as apiClient } from './client';
export { authApi } from './auth';
export { gameApi } from './game';
export { leaderboardApi } from './leaderboard';
export { profileApi } from './profile';

export type { AuthResponse } from './auth';
export type {
  CreateGameResponse,
  JoinGameResponse,
  GameProgress,
} from './game';
export type { LeaderboardEntry, LeaderboardPeriod } from './leaderboard';
export type { UserProfile, UpdateProfileData } from './profile'; 
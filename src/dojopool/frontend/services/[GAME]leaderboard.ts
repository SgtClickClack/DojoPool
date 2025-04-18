import api from "./api";
import { UserProfile } from "../../types/user";

export interface LeaderboardEntry {
  user: Pick<UserProfile, "id" | "username">;
  rank: number;
  points: number;
  level: number;
  recentAchievements: string[];
  trainingStreak: number;
}

export interface LeaderboardFilters {
  timeframe?: "daily" | "weekly" | "monthly" | "all-time";
  style?: string;
  skillLevel?: number;
  region?: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalParticipants: number;
  userRank?: number;
  lastUpdated: string;
}

export async function getLeaderboard(
  filters?: LeaderboardFilters,
): Promise<LeaderboardResponse> {
  const response = await api.get("/leaderboard", { params: filters });
  return response.data;
}

export async function getUserRanking(userId: string): Promise<{
  rank: number;
  points: number;
  nearbyUsers: LeaderboardEntry[];
}> {
  const response = await api.get(`/leaderboard/user/${userId}`);
  return response.data;
}

export async function getStyleLeaders(
  style: string,
): Promise<LeaderboardEntry[]> {
  const response = await api.get(`/leaderboard/style/${style}`);
  return response.data;
}

export async function getRegionalLeaderboard(
  region: string,
): Promise<LeaderboardResponse> {
  const response = await api.get(`/leaderboard/region/${region}`);
  return response.data;
}

export async function getLeaderboardHistory(userId: string): Promise<{
  rankHistory: Array<{ date: string; rank: number }>;
  pointsHistory: Array<{ date: string; points: number }>;
}> {
  const response = await api.get(`/leaderboard/history/${userId}`);
  return response.data;
}

export async function subscribeToLeaderboardUpdates(
  userId: string,
): Promise<void> {
  await api.post("/leaderboard/subscribe", { userId });
}

export async function unsubscribeFromLeaderboardUpdates(
  userId: string,
): Promise<void> {
  await api.post("/leaderboard/unsubscribe", { userId });
}

export async function getLeaderboardStats(): Promise<{
  totalParticipants: number;
  averageLevel: number;
  topStyles: Array<{ style: string; count: number }>;
  mostActiveRegions: Array<{ region: string; participants: number }>;
}> {
  const response = await api.get("/leaderboard/stats");
  return response.data;
}

export async function getChallengeLeaderboard(challengeId: string): Promise<{
  entries: Array<{
    user: Pick<UserProfile, "id" | "username">;
    score: number;
    completionTime: number;
    rank: number;
  }>;
  totalParticipants: number;
}> {
  const response = await api.get(`/leaderboard/challenge/${challengeId}`);
  return response.data;
}

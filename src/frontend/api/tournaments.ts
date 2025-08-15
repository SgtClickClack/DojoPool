import axiosInstance from './axiosInstance';
import { Tournament } from '@/types/tournament';

export const getTournaments = async (): Promise<Tournament[]> => {
  const response = await axiosInstance.get('/v1/tournaments');
  return response.data as Tournament[];
};

export const getTournament = async (id: string): Promise<Tournament> => {
  const response = await axiosInstance.get(`/v1/tournaments/${id}`);
  return response.data as Tournament;
};

export const joinTournament = async (id: string): Promise<void> => {
  await axiosInstance.post(`/v1/tournaments/${id}/join`);
};

export const processPayment = async (tournamentId: string, amount: number): Promise<void> => {
  await axiosInstance.post(`/v1/tournaments/${tournamentId}/payment`, { amount });
};

export const submitMatchResult = async (matchId: string, winnerId: number): Promise<void> => {
  await axiosInstance.post(`/v1/matches/${matchId}/result`, { winnerId });
};

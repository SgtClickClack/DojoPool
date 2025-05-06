import axiosInstance from './axiosInstance';
import { Tournament } from '@/types/tournament';

export const getTournaments = async (): Promise<Tournament[]> => {
  const response = await axiosInstance.get('/tournaments');
  return response.data as Tournament[];
};

export const getTournament = async (id: string): Promise<Tournament> => {
  const response = await axiosInstance.get(`/tournaments/${id}`);
  return response.data as Tournament;
};

export const joinTournament = async (id: string): Promise<void> => {
  await axiosInstance.post(`/tournaments/${id}/join`);
};

export const processPayment = async (tournamentId: string, amount: number): Promise<void> => {
  await axiosInstance.post(`/tournaments/${tournamentId}/payment`, { amount });
};

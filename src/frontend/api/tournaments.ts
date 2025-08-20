import axiosInstance from './axiosInstance';
import { type Tournament } from '../types/tournament';

export const getTournaments = async (): Promise<Tournament[]> => {
  const response = await axiosInstance.get('/v1/tournaments');
  return response.data as Tournament[];
};

export const getTournament = async (id: string): Promise<Tournament> => {
  const response = await axiosInstance.get(`/v1/tournaments/${id}`);
  return response.data as Tournament;
};

export const getTournamentMatches = async (tournamentId: string): Promise<any[]> => {
  const response = await axiosInstance.get(`/v1/tournaments/${tournamentId}/matches`);
  return response.data;
};

export const createTournament = async (data: Partial<Tournament>): Promise<Tournament> => {
  const response = await axiosInstance.post('/v1/tournaments', data);
  return response.data as Tournament;
};

export const updateTournament = async (id: string, data: Partial<Tournament>): Promise<Tournament> => {
  const response = await axiosInstance.put(`/v1/tournaments/${id}`, data);
  return response.data as Tournament;
};

export const registerPlayer = async (tournamentId: string, playerId: string): Promise<Tournament> => {
  const response = await axiosInstance.post(`/v1/tournaments/${tournamentId}/players`, { playerId });
  return response.data as Tournament;
};

export const unregisterPlayer = async (tournamentId: string, playerId: string): Promise<Tournament> => {
  const response = await axiosInstance.delete(`/v1/tournaments/${tournamentId}/players/${playerId}`);
  return response.data as Tournament;
};

export const startTournament = async (tournamentId: string): Promise<Tournament> => {
  const response = await axiosInstance.post(`/v1/tournaments/${tournamentId}/start`);
  return response.data as Tournament;
};

export const updateMatch = async (matchId: string, data: any): Promise<any> => {
  const response = await axiosInstance.put(`/v1/matches/${matchId}`, data);
  return response.data;
};

export const joinTournament = async (id: string): Promise<void> => {
  await axiosInstance.post(`/v1/tournaments/${id}/join`);
};

export const processPayment = async (
  tournamentId: string,
  amount: number
): Promise<void> => {
  await axiosInstance.post(`/v1/tournaments/${tournamentId}/payment`, {
    amount,
  });
};

export const submitMatchResult = async (
  matchId: string,
  winnerId: number
): Promise<void> => {
  await axiosInstance.post(`/v1/matches/${matchId}/result`, { winnerId });
};

export const deleteTournament = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/v1/tournaments/${id}`);
};

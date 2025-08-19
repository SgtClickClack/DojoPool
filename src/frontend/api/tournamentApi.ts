import axiosInstance from './axiosInstance';
import { type Tournament } from '../types/tournament';
import { type ListEnvelope } from '../types/Api';

// Tournament endpoints
export const createTournament = async (data: Partial<Tournament>): Promise<Tournament> => {
  const res = await axiosInstance.post('/v1/tournaments', data);
  return res.data as Tournament;
};

export const getTournaments = async (): Promise<Tournament[]> => {
  const res = await axiosInstance.get('/v1/tournaments');
  // Backend returns { data: { tournaments: [] } }
  const envelope = res.data as ListEnvelope<Tournament>;
  return envelope?.data?.tournaments ?? [];
};

export const getTournamentById = async (id: string): Promise<Tournament> => {
  const res = await axiosInstance.get(`/v1/tournaments/${id}`);
  return res.data as Tournament;
};

export const joinTournament = async (id: string): Promise<void> => {
  await axiosInstance.post(`/v1/tournaments/${id}/join`);
};

export const startTournament = async (id: string): Promise<void> => {
  await axiosInstance.post(`/v1/tournaments/${id}/start`);
};

export const advanceTournament = async (id: string): Promise<void> => {
  await axiosInstance.post(`/v1/tournaments/${id}/advance`);
};

// Match endpoints
export const getMatchById = async (id: string): Promise<unknown> => {
  const res = await axiosInstance.get(`/v1/matches/${id}`);
  return res.data as unknown;
};

export const submitMatchResult = async (id: string, data: Record<string, unknown>): Promise<unknown> => {
  const res = await axiosInstance.post(`/v1/matches/${id}/result`, data);
  return res.data as unknown;
};

export { getTournaments as listTournaments };

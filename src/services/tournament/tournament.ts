import { Tournament, TournamentMatch, TournamentParticipant } from '../../types/tournament';
import { api } from '../api';

export const getTournaments = async (): Promise<Tournament[]> => {
  const response = await api.get('/api/tournaments');
  return response.data;
};

export const getTournamentById = async (id: string): Promise<Tournament> => {
  const response = await api.get(`/api/tournaments/${id}`);
  return response.data;
};

export const registerForTournament = async (tournamentId: string): Promise<void> => {
  await api.post(`/api/tournaments/${tournamentId}/register`);
};

export const withdrawFromTournament = async (tournamentId: string): Promise<void> => {
  await api.post(`/api/tournaments/${tournamentId}/withdraw`);
};

export const getTournamentParticipants = async (tournamentId: string): Promise<TournamentParticipant[]> => {
  const response = await api.get(`/api/tournaments/${tournamentId}/participants`);
  return response.data;
};

export const getTournamentMatches = async (tournamentId: string): Promise<TournamentMatch[]> => {
  const response = await api.get(`/api/tournaments/${tournamentId}/matches`);
  return response.data;
};

export const getTournamentBracket = async (tournamentId: string): Promise<any> => {
  const response = await api.get(`/api/tournaments/${tournamentId}/bracket`);
  return response.data;
};

export const checkInForMatch = async (tournamentId: string, matchId: string): Promise<void> => {
  await api.post(`/api/tournaments/${tournamentId}/matches/${matchId}/check-in`);
};

export const submitMatchResult = async (
  tournamentId: string,
  matchId: string,
  result: Record<string, unknown>
): Promise<void> => {
  await api.post(`/api/tournaments/${tournamentId}/matches/${matchId}/result`, result);
};

export const getTournamentStats = async (tournamentId: string): Promise<Record<string, unknown>> => {
  const response = await api.get(`/api/tournaments/${tournamentId}/stats`);
  return response.data;
};

interface CheckInData {
  qrCode: string;
  latitude: number;
  longitude: number;
}

export const checkInForTournament = async (tournamentId: string, data: CheckInData): Promise<void> => {
  await api.post(`/api/tournaments/${tournamentId}/check-in`, data);
}; 
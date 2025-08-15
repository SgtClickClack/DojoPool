import axios from "axios";
import {
  Tournament,
  TournamentParticipant,
  TournamentMatch,
  TournamentFilters,
  CreateTournamentData,
  TournamentMatchUpdateData,
} from "../types/tournament";

const BASE_URL = "/api/tournaments";

export const getTournaments = async (params?: any) => {
  const response = await axios.get(BASE_URL, { params });
  return response.data;
};

export const getTournament = async (id: number) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const createTournament = async (data: any) => {
  const response = await axios.post(BASE_URL, data);
  return response.data;
};

export const updateTournament = async (id: number, data: any) => {
  const response = await axios.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const registerForTournament = async (id: number) => {
  const response = await axios.post(`${BASE_URL}/${id}/register`);
  return response.data;
};

export const generateBracket = async (id: number) => {
  const response = await axios.post(`${BASE_URL}/${id}/bracket`);
  return response.data;
};

export const getTournamentMatches = async (id: number, round?: number) => {
  const response = await axios.get(`${BASE_URL}/${id}/matches`, {
    params: { round },
  });
  return response.data;
};

export const updateMatch = async (id: number, data: any) => {
  const response = await axios.put(`${BASE_URL}/matches/${id}`, data);
  return response.data;
};

export const getMatchHistory = async (participantId: number, params?: any) => {
  const response = await axios.get(
    `${BASE_URL}/participants/${participantId}/matches`,
    {
      params,
    },
  );
  return response.data;
};

export const getParticipantStats = async (participantId: number) => {
  const response = await axios.get(
    `${BASE_URL}/participants/${participantId}/stats`,
  );
  return response.data;
};

export const getTournamentStats = async (id: number) => {
  const response = await axios.get(`${BASE_URL}/${id}/stats`);
  return response.data;
};

export const recordScore = async (matchId: number, scoreData: any) => {
  const response = await axios.post(
    `${BASE_URL}/matches/${matchId}/score`,
    scoreData,
  );
  return response.data;
};

export const getUnclaimedPrizes = async (userId: number, params?: any) => {
  const response = await axios.get(`${BASE_URL}/prizes/unclaimed`, {
    params: { user_id: userId, ...params },
  });
  return response.data;
};

export const getPrizeHistory = async (userId: number, params?: any) => {
  const response = await axios.get(`${BASE_URL}/prizes/history`, {
    params: { user_id: userId, ...params },
  });
  return response.data;
};

export const claimPrize = async (
  participantId: number,
  tournamentId: number,
) => {
  const response = await axios.post(`${BASE_URL}/prizes/claim`, {
    participant_id: participantId,
    tournament_id: tournamentId,
  });
  return response.data;
};

export const configurePrizeRule = async (
  tournamentId: number,
  distribution: any,
) => {
  const response = await axios.post(
    `${BASE_URL}/${tournamentId}/prize-rule`,
    distribution,
  );
  return response.data;
};

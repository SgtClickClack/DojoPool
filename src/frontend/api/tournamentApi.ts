import axiosInstance from './axiosInstance';

// Tournament endpoints
export const createTournament = async (data: any) => {
  const res = await axiosInstance.post('/tournaments', data);
  return res.data;
};

export const getTournaments = async () => {
  const res = await axiosInstance.get('/tournaments');
  return res.data;
};

export const getTournamentById = async (id: string) => {
  const res = await axiosInstance.get(`/tournaments/${id}`);
  return res.data;
};

export const joinTournament = async (id: string) => {
  const res = await axiosInstance.post(`/tournaments/${id}/join`);
  return res.data;
};

export const startTournament = async (id: string) => {
  const res = await axiosInstance.post(`/tournaments/${id}/start`);
  return res.data;
};

export const advanceTournament = async (id: string) => {
  const res = await axiosInstance.post(`/tournaments/${id}/advance`);
  return res.data;
};

// Match endpoints
export const getMatchById = async (id: string) => {
  const res = await axiosInstance.get(`/matches/${id}`);
  return res.data;
};

export const submitMatchResult = async (id: string, data: any) => {
  const res = await axiosInstance.post(`/matches/${id}/result`, data);
  return res.data;
};

export { getTournaments as listTournaments };

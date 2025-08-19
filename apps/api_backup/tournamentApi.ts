import axiosInstance from './axiosInstance';

// Tournament endpoints
export const createTournament = async (data: any) => {
  const res = await axiosInstance.post('/v1/tournaments', data);
  return res.data;
};

export const getTournaments = async () => {
  const res = await axiosInstance.get('/v1/tournaments');
  // Backend returns { data: { tournaments: [] } }
  return res.data?.data?.tournaments || [];
};

export const getTournamentById = async (id: string) => {
  const res = await axiosInstance.get(`/v1/tournaments/${id}`);
  return res.data;
};

export const joinTournament = async (id: string) => {
  const res = await axiosInstance.post(`/v1/tournaments/${id}/join`);
  return res.data;
};

export const startTournament = async (id: string) => {
  const res = await axiosInstance.post(`/v1/tournaments/${id}/start`);
  return res.data;
};

export const advanceTournament = async (id: string) => {
  const res = await axiosInstance.post(`/v1/tournaments/${id}/advance`);
  return res.data;
};

// Match endpoints
export const getMatchById = async (id: string) => {
  const res = await axiosInstance.get(`/v1/matches/${id}`);
  return res.data;
};

export const submitMatchResult = async (id: string, data: any) => {
  const res = await axiosInstance.post(`/v1/matches/${id}/result`, data);
  return res.data;
};

export { getTournaments as listTournaments };

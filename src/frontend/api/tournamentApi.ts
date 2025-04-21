import axios from './axiosInstance';

// Tournament endpoints
export const createTournament = async (data: any) => {
  const res = await axios.post('/api/tournaments', data);
  return res.data;
};

export const listTournaments = async () => {
  const res = await axios.get('/api/tournaments');
  return res.data;
};

export const getTournament = async (id: number) => {
  const res = await axios.get(`/api/tournaments/${id}`);
  return res.data;
};

export const joinTournament = async (id: number) => {
  const res = await axios.post(`/api/tournaments/${id}/join`);
  return res.data;
};

export const startTournament = async (id: number) => {
  const res = await axios.post(`/api/tournaments/${id}/start`);
  return res.data;
};

export const advanceTournament = async (id: number) => {
  const res = await axios.post(`/api/tournaments/${id}/advance`);
  return res.data;
};

// Match endpoints
export const getMatch = async (id: number) => {
  const res = await axios.get(`/api/matches/${id}`);
  return res.data;
};

export const submitMatchResult = async (id: number, data: any) => {
  const res = await axios.post(`/api/matches/${id}/result`, data);
  return res.data;
};

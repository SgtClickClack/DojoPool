import axiosInstance from './axiosInstance';

export interface Tournament {
  id: string;
  name: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  matches: {
    id: string;
    player1: string | null;
    player2: string | null;
    score1: number;
    score2: number;
    winner: string | null;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  registrationDeadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  entryFee: number;
  divisions: string[];
}

export const getTournaments = async (): Promise<Tournament[]> => {
  const response = await axiosInstance.get('/tournaments');
  return response.data;
};

export const getTournament = async (id: string): Promise<Tournament> => {
  const response = await axiosInstance.get(`/tournaments/${id}`);
  return response.data;
};

export const joinTournament = async (id: string): Promise<void> => {
  await axiosInstance.post(`/tournaments/${id}/join`);
};

export const processPayment = async (tournamentId: string, amount: number): Promise<void> => {
  await axiosInstance.post(`/tournaments/${tournamentId}/payment`, { amount });
};

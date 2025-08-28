import axios from 'axios';
import { type Venue, type VenueEvent } from '../types/venue';

interface GetVenuesParams {
  limit?: number;
  offset?: number;
  name?: string;
  is_verified?: boolean;
}

interface GetVenuesResponse {
  items: Venue[];
  total: number;
}

interface CreateEventParams {
  venueId: number;
  name: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time: string;
  registration_deadline?: string;
  max_participants?: number;
  entry_fee?: number;
  prize_pool?: number;
}

interface CheckInParams {
  venueId: number;
  table_number: number;
  game_type: string;
}

const BASE_URL = '/api/venues';

export const getVenues = async (
  params: GetVenuesParams
): Promise<GetVenuesResponse> => {
  const response = await axios.get(BASE_URL, { params });
  return response.data;
};

export const getVenue = async (id: number): Promise<Venue> => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const checkInUser = async (params: CheckInParams): Promise<void> => {
  await axios.post(`${BASE_URL}/check-in`, params);
};

export const checkOutUser = async (): Promise<void> => {
  await axios.post(`${BASE_URL}/check-out`);
};

export const getVenueLeaderboard = async (
  venueId: number,
  period?: string,
  params?: any
) => {
  const response = await axios.get(`${BASE_URL}/${venueId}/leaderboard`, {
    params: { period, ...params },
  });
  return response.data;
};

export const getUserStats = async (venueId: number, userId: number) => {
  const response = await axios.get(
    `${BASE_URL}/${venueId}/users/${userId}/stats`
  );
  return response.data;
};

export const updateLeaderboard = async (venueId: number, data: any) => {
  const response = await axios.put(`${BASE_URL}/${venueId}/leaderboard`, data);
  return response.data;
};

export const getVenueEvents = async (
  venueId: number,
  status?: string,
  limit: number = 10,
  offset: number = 0
): Promise<VenueEvent[]> => {
  const response = await axios.get(`${BASE_URL}/${venueId}/events`, {
    params: { status, limit, offset },
  });
  return response.data;
};

export const createEvent = async (
  params: CreateEventParams
): Promise<VenueEvent> => {
  const response = await axios.post(`${BASE_URL}/events`, params);
  return response.data;
};

export const updateEvent = async (
  eventId: number,
  params: Partial<CreateEventParams>
): Promise<VenueEvent> => {
  const response = await axios.put(`${BASE_URL}/events/${eventId}`, params);
  return response.data;
};

export const registerForEvent = async (eventId: number): Promise<void> => {
  await axios.post(`${BASE_URL}/events/${eventId}/register`);
};

export const getEventParticipants = async (eventId: number) => {
  const response = await axios.get(
    `${BASE_URL}/events/${eventId}/participants`
  );
  return response.data;
};

export const checkInParticipant = async (
  eventId: number,
  participantId: number
) => {
  const response = await axios.post(
    `${BASE_URL}/events/${eventId}/participants/${participantId}/check-in`
  );
  return response.data;
};

export const checkIn = async (venueId: number, data?: any) => {
  const response = await axios.post(`${BASE_URL}/${venueId}/check-in`, data);
  return response.data;
};

export const checkOut = async (venueId: number) => {
  const response = await axios.post(`${BASE_URL}/${venueId}/check-out`);
  return response.data;
};

export const getActiveCheckins = async (venueId: number, params?: any) => {
  const response = await axios.get(`${BASE_URL}/${venueId}/check-ins/active`, {
    params,
  });
  return response.data;
};

export const getCheckinHistory = async (venueId: number, params?: any) => {
  const response = await axios.get(`${BASE_URL}/${venueId}/check-ins/history`, {
    params,
  });
  return response.data;
};

export const getOccupancyStats = async (
  venueId: number,
  period: string = 'day'
) => {
  const response = await axios.get(`${BASE_URL}/${venueId}/occupancy`, {
    params: { period },
  });
  return response.data;
};

// Sponsorship and Quest Management APIs
export interface SponsorshipData {
  tournamentId: string;
  benefits: string[];
  duration: number; // in days
  budget: number;
  targetAudience?: string;
  promotionChannels?: string[];
}

export interface VenueQuest {
  id: string;
  venueId: string;
  title: string;
  description: string;
  requirements: {
    type: 'wins' | 'games' | 'time' | 'streak';
    value: number;
    gameType?: string;
  };
  rewards: {
    dojoCoins: number;
    xp: number;
    items?: string[];
  };
  duration: number; // in days
  maxParticipants: number;
  currentParticipants: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface QuestCreationData {
  title: string;
  description: string;
  requirements: VenueQuest['requirements'];
  rewards: VenueQuest['rewards'];
  duration: number;
  maxParticipants: number;
}

// Sponsorship APIs
export const sponsorTournament = async (
  venueId: number,
  sponsorshipData: SponsorshipData
): Promise<{ success: boolean; message: string; sponsorshipId: string }> => {
  const response = await axios.post(
    `${BASE_URL}/${venueId}/sponsorships`,
    sponsorshipData
  );
  return response.data;
};

export const getTournamentSponsorships = async (
  venueId: number
): Promise<SponsorshipData[]> => {
  const response = await axios.get(`${BASE_URL}/${venueId}/sponsorships`);
  return response.data;
};

export const updateSponsorship = async (
  venueId: number,
  sponsorshipId: string,
  updates: Partial<SponsorshipData>
): Promise<SponsorshipData> => {
  const response = await axios.put(
    `${BASE_URL}/${venueId}/sponsorships/${sponsorshipId}`,
    updates
  );
  return response.data;
};

export const cancelSponsorship = async (
  venueId: number,
  sponsorshipId: string
): Promise<void> => {
  await axios.delete(`${BASE_URL}/${venueId}/sponsorships/${sponsorshipId}`);
};

// Quest Management APIs
export const createVenueQuest = async (
  venueId: number,
  questData: QuestCreationData
): Promise<VenueQuest> => {
  const response = await axios.post(`${BASE_URL}/${venueId}/quests`, questData);
  return response.data;
};

export const getVenueQuests = async (
  venueId: number,
  status?: 'active' | 'completed' | 'expired'
): Promise<VenueQuest[]> => {
  const response = await axios.get(`${BASE_URL}/${venueId}/quests`, {
    params: { status },
  });
  return response.data;
};

export const updateVenueQuest = async (
  venueId: number,
  questId: string,
  updates: Partial<QuestCreationData>
): Promise<VenueQuest> => {
  const response = await axios.put(
    `${BASE_URL}/${venueId}/quests/${questId}`,
    updates
  );
  return response.data;
};

export const deleteVenueQuest = async (
  venueId: number,
  questId: string
): Promise<void> => {
  await axios.delete(`${BASE_URL}/${venueId}/quests/${questId}`);
};

export const getQuestParticipants = async (
  venueId: number,
  questId: string
): Promise<any[]> => {
  const response = await axios.get(
    `${BASE_URL}/${venueId}/quests/${questId}/participants`
  );
  return response.data;
};

// Public APIs for users
export const getSponsoredTournaments = async (): Promise<any[]> => {
  const response = await axios.get(`${BASE_URL}/sponsored-tournaments`);
  return response.data;
};

export const joinVenueQuest = async (
  venueId: number,
  questId: string
): Promise<void> => {
  await axios.post(`${BASE_URL}/${venueId}/quests/${questId}/join`);
};

export const getUserQuestProgress = async (
  venueId: number,
  questId: string
): Promise<{
  completed: boolean;
  progress: number;
  requirements: VenueQuest['requirements'];
  rewards: VenueQuest['rewards'];
}> => {
  const response = await axios.get(
    `${BASE_URL}/${venueId}/quests/${questId}/progress`
  );
  return response.data;
};

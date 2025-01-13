import { api } from './api';
import { Venue, VenueEvent, LeaderboardEntry } from '../types/venue';
import axios from 'axios';

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

export const getVenues = async (params: GetVenuesParams): Promise<GetVenuesResponse> => {
  const response = await api.get('/venues', { params });
  return response.data;
};

export const getVenue = async (id: number): Promise<Venue> => {
  const response = await api.get(`/venues/${id}`);
  return response.data;
};

export const checkInUser = async (params: CheckInParams): Promise<void> => {
  await api.post(`/venues/${params.venueId}/check-in`, params);
};

export const checkOutUser = async (): Promise<void> => {
  await api.post('/venues/check-out');
};

export const getVenueLeaderboard = async (venueId: number, period?: string, params?: any) => {
  const response = await axios.get(`/api/venues/${venueId}/leaderboard`, {
    params: { period, ...params },
  });
  return response.data;
};

export const getUserStats = async (venueId: number, userId: number) => {
  const response = await axios.get(`/api/venues/${venueId}/leaderboard/user/${userId}`);
  return response.data;
};

export const updateLeaderboard = async (venueId: number, data: any) => {
  const response = await axios.post(`/api/venues/${venueId}/leaderboard`, data);
  return response.data;
};

export const getVenueEvents = async (
  venueId: number,
  status?: string,
  limit: number = 10,
  offset: number = 0
): Promise<VenueEvent[]> => {
  const response = await api.get(`/venues/${venueId}/events`, {
    params: { status, limit, offset },
  });
  return response.data;
};

export const createEvent = async (params: CreateEventParams): Promise<VenueEvent> => {
  const response = await api.post(`/venues/${params.venueId}/events`, params);
  return response.data;
};

export const registerForEvent = async (eventId: number): Promise<void> => {
  await api.post(`/venues/events/${eventId}/register`);
};

export const checkIn = async (venueId: number, data?: any) => {
  const response = await axios.post(`/api/venues/${venueId}/check-in`, data);
  return response.data;
};

export const checkOut = async (venueId: number) => {
  const response = await axios.post(`/api/venues/${venueId}/check-out`);
  return response.data;
};

export const getActiveCheckins = async (venueId: number, params?: any) => {
  const response = await axios.get(`/api/venues/${venueId}/active-checkins`, {
    params,
  });
  return response.data;
};

export const getCheckinHistory = async (venueId: number, params?: any) => {
  const response = await axios.get(`/api/venues/${venueId}/checkin-history`, {
    params,
  });
  return response.data;
};

export const getOccupancyStats = async (venueId: number, period: string = 'day') => {
  const response = await axios.get(`/api/venues/${venueId}/occupancy-stats`, {
    params: { period },
  });
  return response.data;
};

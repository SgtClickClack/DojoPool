// Venue service for check-in operations

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export interface CheckInData {
  method: 'qr' | 'geo' | 'manual';
  qrCode?: string | null;
  location?: { latitude: number; longitude: number } | null;
  tableNumber?: string;
  gameType?: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  username: string;
  venueId: string;
  checkedInAt: string;
  checkedOutAt?: string;
  tableNumber?: string;
  gameType?: string;
  duration?: string;
}

export interface OccupancyStats {
  currentOccupancy: number;
  maxCapacity: number;
  peakToday: number;
  totalToday: number;
  checkInsByHour?: Array<{ hour: number; count: number }>;
}

export const checkIn = async (
  venueId: string,
  data: CheckInData
): Promise<CheckIn> => {
  try {
    const response = await fetch(`${API_BASE_URL}/venues/${venueId}/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to check in');
    }

    return await response.json();
  } catch (error) {
    console.error('Check-in error:', error);
    throw error;
  }
};

export const checkOut = async (venueId: string): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/venues/${venueId}/check-out`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to check out');
    }
  } catch (error) {
    console.error('Check-out error:', error);
    throw error;
  }
};

export const getActiveCheckins = async (
  venueId: string
): Promise<CheckIn[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/venues/${venueId}/check-ins/active`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch active check-ins');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching active check-ins:', error);
    return [];
  }
};

export const getCheckinHistory = async (
  venueId: string
): Promise<CheckIn[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/venues/${venueId}/check-ins/history`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch check-in history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching check-in history:', error);
    return [];
  }
};

export const getOccupancyStats = async (
  venueId: string
): Promise<OccupancyStats> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/venues/${venueId}/occupancy/stats`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch occupancy stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching occupancy stats:', error);
    return {
      currentOccupancy: 0,
      maxCapacity: 100,
      peakToday: 0,
      totalToday: 0,
    };
  }
};

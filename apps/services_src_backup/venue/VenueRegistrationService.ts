export type VenueRegistrationPayload = {
  name: string;
  address: string;
  city: string;
  state: string;
  capacity: number;
  tables: number;
  amenities: string[];
};

export type VenueRegistrationResponse = {
  id: string;
  name: string;
  location: { address: string; city: string; state: string };
  capacity: number;
  tables: number;
  amenities: string[];
  status: 'active' | 'maintenance' | 'closed';
};

class VenueRegistrationService {
  private baseUrl: string;

  constructor() {
    const base = process.env.NEXT_PUBLIC_API_URL;
    this.baseUrl = base && base.length > 0 ? base : '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        if (data?.message) message = data.message;
      } catch {}
      throw new Error(message);
    }
    return res.json();
  }

  async registerVenue(payload: VenueRegistrationPayload): Promise<VenueRegistrationResponse> {
    return this.request<VenueRegistrationResponse>(`/venues/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const venueRegistrationService = new VenueRegistrationService();

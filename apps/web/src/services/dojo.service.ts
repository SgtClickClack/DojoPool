export interface Dojo {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  owner: string;
  createdAt: string;
}

export interface CreateDojoData {
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  owner: string;
}

export interface UpdateDojoData {
  name?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  owner?: string;
}

class DojoService {
  private baseUrl = '/api/dojos';

  async getDojos(): Promise<Dojo[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch dojos: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching dojos:', error);
      throw error;
    }
  }

  async getDojoById(id: string): Promise<Dojo> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch dojo: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching dojo:', error);
      throw error;
    }
  }

  async createDojo(data: CreateDojoData): Promise<Dojo> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Failed to create dojo: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating dojo:', error);
      throw error;
    }
  }

  async updateDojo(id: string, data: UpdateDojoData): Promise<Dojo> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Failed to update dojo: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating dojo:', error);
      throw error;
    }
  }

  async deleteDojo(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete dojo: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting dojo:', error);
      throw error;
    }
  }

  async getCandidates(
    lat: number,
    lng: number,
    radius: number
  ): Promise<DojoCandidate[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/candidates?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch dojo candidates: ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching dojo candidates:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          name: 'Jade Tiger Dojo',
          location: {
            latitude: lat + 0.001,
            longitude: lng + 0.001,
            address: '123 Valley Road, Fortitude Valley',
          },
          status: 'active' as const,
          owner: 'RyuKlaw',
          createdAt: new Date().toISOString(),
          distance: 0.1,
          controllingClanId: 'crimson-monkey',
          controllingClan: 'Crimson Monkey',
          homeDojo: 'Jade Tiger Dojo',
        },
      ];
    }
  }
}

export const dojoService = new DojoService();
export type { DojoCandidate } from './types';
export { DojoService };

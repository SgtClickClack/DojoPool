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
}

export const dojoService = new DojoService();

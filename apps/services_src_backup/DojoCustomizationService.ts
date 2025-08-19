import {
  CustomizationItem,
  CustomizationItemsResponse,
  DojoCustomization,
  DojoCustomizationCreate,
  DojoCustomizationResponse,
  DojoCustomizationUpdate,
} from '../types/dojoCustomization';

export class DojoCustomizationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Unknown error' }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  async getDojoCustomizations(
    dojoId: string
  ): Promise<DojoCustomizationResponse> {
    return this.request<DojoCustomizationResponse>(
      `/dojos/${dojoId}/customizations`
    );
  }

  async getAllCustomizationItems(): Promise<CustomizationItemsResponse> {
    return this.request<CustomizationItemsResponse>('/customizations');
  }

  async getCustomizationItemsByType(
    type: string
  ): Promise<CustomizationItem[]> {
    const response = await this.getAllCustomizationItems();
    return response.items.filter((item) => item.type === type);
  }

  async getCustomizationItemsByCategory(
    category: string
  ): Promise<CustomizationItem[]> {
    const response = await this.getAllCustomizationItems();
    return response.items.filter((item) => item.category === category);
  }

  async unlockCustomization(
    dojoId: string,
    customization: DojoCustomizationCreate
  ): Promise<DojoCustomization> {
    return this.request<DojoCustomization>(`/dojos/${dojoId}/customizations`, {
      method: 'POST',
      body: JSON.stringify(customization),
    });
  }

  async applyCustomization(
    dojoId: string,
    customizationId: string,
    update: DojoCustomizationUpdate
  ): Promise<DojoCustomization> {
    return this.request<DojoCustomization>(
      `/dojos/${dojoId}/customizations/${customizationId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(update),
      }
    );
  }

  async removeCustomization(
    dojoId: string,
    customizationId: string
  ): Promise<void> {
    return this.request<void>(
      `/dojos/${dojoId}/customizations/${customizationId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async getDojoCustomizationStats(
    dojoId: string
  ): Promise<DojoCustomizationStats> {
    const customizations = await this.getDojoCustomizations(dojoId);

    return {
      totalUnlocked: customizations.totalCustomizations,
      totalApplied: customizations.appliedCustomizations,
      availableSlots: 10, // TODO: Make this configurable based on dojo level
      customizationLevel: Math.floor(customizations.totalCustomizations / 5), // Basic level calculation
    };
  }

  async searchCustomizationItems(query: string): Promise<CustomizationItem[]> {
    const response = await this.getAllCustomizationItems();
    const searchTerm = query.toLowerCase();

    return response.items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
  }
}

export const dojoCustomizationService = new DojoCustomizationService();

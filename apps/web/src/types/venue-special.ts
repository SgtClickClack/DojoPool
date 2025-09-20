export interface VenueSpecial {
  id: string;
  venueId: string;
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVenueSpecialRequest {
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  discountPercentage?: number;
  specialPrice?: number;
  conditions?: string;
  isActive?: boolean;
}

export interface VenueSpecialFilters {
  active?: boolean;
  upcoming?: boolean;
  sortBy?: 'createdAt' | 'startsAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

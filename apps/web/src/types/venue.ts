export interface VenueAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface VenueTable {
  id: string;
  venueId: string;
  tableNumber: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RESERVED';
  players: number;
  maxPlayers: number;
  currentGame?: {
    id: string;
    type: string;
    status: string;
    players: Array<{
      id: string;
      username: string;
    }>;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueReview {
  id: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  timestamp: string;
  helpful: number;
}

export interface VenueFeature {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface VenueHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

export interface VenueContact {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface Venue {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CLOSED';
  address: VenueAddress;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  reviews?: VenueReview[];
  tables?: VenueTable[];
  features?: string[];
  amenities?: string[];
  hours?: VenueHours[];
  contact?: VenueContact;
  ownerId?: string;
  controllingClanId?: string;
  isVerified: boolean;
  distance?: number; // in kilometers
  createdAt: string;
  updatedAt: string;
}

export interface VenueSearchFilters {
  search?: string;
  city?: string;
  state?: string;
  hasTournaments?: boolean;
  hasFood?: boolean;
  hasBar?: boolean;
  hasParking?: boolean;
  minRating?: number;
  maxDistance?: number;
  tableTypes?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  page?: number;
  limit?: number;
}

export interface VenueSearchResponse {
  venues: Venue[];
  total: number;
  page: number;
  totalPages: number;
  filters: VenueSearchFilters;
}

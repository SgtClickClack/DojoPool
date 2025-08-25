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
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  type: 'POOL' | 'SNOOKER' | 'CAROM';
  size: '7_FOOT' | '8_FOOT' | '9_FOOT' | '12_FOOT';
  hourlyRate?: number;
  features?: string[];
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
}

export interface VenueSearchResponse {
  venues: Venue[];
  total: number;
  page: number;
  totalPages: number;
  filters: VenueSearchFilters;
}

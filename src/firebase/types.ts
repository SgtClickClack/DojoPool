export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastLogin: string;
  isAdmin?: boolean;
}

export interface Game {
  id?: string;
  createdBy: string;
  participants: Record<string, boolean>;
  status: "active" | "completed" | "cancelled";
  type: "8ball" | "9ball" | "snooker";
  score?: {
    [userId: string]: number;
  };
  winner?: string;
  venueId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id?: string;
  name: string;
  location: string;
  address: string;
  rating: number;
  tables: number;
  amenities: string[];
  images: string[];
  operatingHours: {
    [day: string]: {
      open: string;
      close: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  id?: string;
  name: string;
  organizer: string;
  venueId: string;
  type: "8ball" | "9ball" | "snooker";
  status: "upcoming" | "active" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
  participants: Record<string, boolean>;
  prizes: {
    [position: string]: string;
  };
  rules: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

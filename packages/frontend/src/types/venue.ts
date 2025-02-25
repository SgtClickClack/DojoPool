export enum VenueStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    CLOSED = 'CLOSED'
}

export enum TableType {
    STANDARD = 'STANDARD',
    TOURNAMENT = 'TOURNAMENT',
    SNOOKER = 'SNOOKER',
    PRACTICE = 'PRACTICE'
}

export enum TableStatus {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    RESERVED = 'RESERVED',
    MAINTENANCE = 'MAINTENANCE'
}

export interface PoolTable {
    id: string;
    number: number;
    type: TableType;
    status: TableStatus;
    size: string;
    condition: number; // 1-5 rating
    lastMaintenance?: Date;
    currentGame?: {
        id: string;
        startTime: Date;
        players: string[]; // player IDs
    };
    nextReservation?: {
        id: string;
        startTime: Date;
        endTime: Date;
        players: string[]; // player IDs
    };
}

export interface BusinessHours {
    day: number; // 0-6, where 0 is Sunday
    open: string; // HH:mm format
    close: string; // HH:mm format
    closed: boolean;
}

export interface VenueAmenity {
    id: string;
    name: string;
    description?: string;
    icon?: string;
}

export interface VenuePricing {
    type: 'PER_HOUR' | 'PER_GAME' | 'MEMBERSHIP';
    amount: number;
    currency: string;
    description: string;
    peakHours?: {
        start: string; // HH:mm format
        end: string; // HH:mm format
        multiplier: number;
    };
}

export interface VenueStats {
    totalTables: number;
    availableTables: number;
    averageWaitTime: number; // in minutes
    currentOccupancy: number; // percentage
    popularHours: {
        hour: number;
        occupancy: number;
    }[];
}

export interface Venue {
    id: string;
    name: string;
    description: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    contact: {
        phone: string;
        email: string;
        website?: string;
    };
    status: VenueStatus;
    businessHours: BusinessHours[];
    tables: PoolTable[];
    amenities: VenueAmenity[];
    pricing: VenuePricing[];
    rating: number;
    reviewCount: number;
    photos: string[];
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    stats: VenueStats;
    features: {
        hasParking: boolean;
        isWheelchairAccessible: boolean;
        hasFood: boolean;
        hasBar: boolean;
        hasTournaments: boolean;
        hasTraining: boolean;
    };
    rules: {
        minimumAge?: number;
        dresscode?: string;
        reservationRequired: boolean;
        membershipRequired: boolean;
    };
}

export interface VenueEvent {
    id: string;
    venueId: string;
    name: string;
    description: string;
    eventType: 'tournament' | 'league' | 'social' | 'training';
    startTime: string;
    endTime: string;
    registrationDeadline?: string;
    maxParticipants?: number;
    currentParticipants: number;
    entryFee?: number;
    prizePool?: number;
    status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
    participants: {
        id: string;
        name: string;
        registeredAt: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

export interface LeaderboardEntry {
    id: string;
    userId: string;
    name: string;
    rank: number;
    points: number;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    averageScore: number;
    highestScore: number;
    streak: number;
    lastPlayed: string;
} 
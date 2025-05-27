// Define possible tournament formats (Keep this)
export enum TournamentFormat {
    SINGLE_ELIMINATION = 'Single Elimination',
    DOUBLE_ELIMINATION = 'Double Elimination',
    ROUND_ROBIN = 'Round Robin',
    SWISS = 'Swiss',
    // Add other formats as needed
}

// Define possible tournament statuses (Keep this)
export enum TournamentStatus {
    UPCOMING = 'Upcoming', // Not yet started, registration may be open or closed
    OPEN = 'Open',       // Open for registration
    FULL = 'Full',       // Registration closed (max participants reached)
    CLOSED = 'Closed',     // Registration closed (manually or deadline passed)
    ACTIVE = 'Active',     // Tournament in progress
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
}

// Define Participant structure based on src/dojopool/frontend/types/tournament.ts
export interface Participant {
  id: string;        // User ID likely
  username: string;  // User's display name
  status: string;    // Status within the tournament (e.g., 'registered', 'eliminated')
  // Add other relevant fields if needed/available from API (e.g., seed, avatar)
}

// Define Match structure for tournament brackets
export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  participant1?: Participant;
  participant2?: Participant;
  winner?: Participant;
  score?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'bye';
  startTime?: string;
  spectatorCount?: number;
}

// Define the UNIFIED Tournament interface
export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat; 
  startDate: Date; 
  endDate?: Date; 
  venueId?: string; 
  organizerId: string;
  participants: number; 
  maxParticipants: number;
  entryFee?: number; 
  currency?: string; 
  status: TournamentStatus;
  winnerId?: string;
  runnerUpId?: string;
  description?: string; 
  rules?: string; 
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  participantsList?: Participant[]; // Keep participants list
  matches?: Match[]; // Full match objects for bracket logic
  prizePool?: number; // Add the missing prizePool property
}

// Remove the duplicate interface definition and old enums below this line
/*
export interface Tournament {
    id: string; // Unique identifier
    // ... other fields ...
}
*/

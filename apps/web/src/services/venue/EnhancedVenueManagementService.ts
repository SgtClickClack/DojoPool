// EnhancedVenueManagementService.ts
// Minimal in-browser service (localStorage/in-memory fallback) to support Venue Management MVP
// NOTE: This is a client-side mock for development. Replace with real API calls when backend is ready.

export type Period = 'daily' | 'weekly' | 'monthly';

export interface VenueLocation {
  address: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

export type VenueStatusType = 'active' | 'maintenance' | 'closed';

export interface Venue {
  id: string;
  name: string;
  location: VenueLocation;
  capacity: number;
  tables: number;
  amenities: string[];
  status: VenueStatusType;
}

export interface VenueAnalytics {
  venueId: string;
  period: Period;
  metrics: {
    totalVisitors: number;
    uniqueVisitors: number;
    matchesPlayed: number;
    tournamentsHosted: number;
    revenue: number;
    dojoCoinsEarned: number;
    topPlayers: Array<{ userId: string; matches: number; wins: number }>
  };
  trends: {
    visitorGrowth: number;
    revenueGrowth: number;
    matchGrowth: number;
    tournamentGrowth: number;
  };
}

export interface VenueStatus {
  venueId: string;
  status: VenueStatusType;
  activeTables: number;
  currentVisitors: number;
  ongoingMatches: number;
  activeTournaments: number;
  systemHealth: Record<string, boolean>;
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info' | 'success';
    message: string;
    resolved?: boolean;
  }>;
}

export type ScheduleType = 'weekly' | 'daily';

export interface TournamentSchedule {
  id: string;
  venueId: string;
  name: string;
  type: ScheduleType;
  enabled: boolean;
  autoCreate?: boolean;
  lastCreated?: string;
  schedule: {
    days: string[]; // e.g., ['Mon', 'Wed']
    startTime: string; // '18:00'
    endTime: string; // '22:00'
    maxParticipants: number;
    entryFee: number;
    prizePool: number;
  };
}

export interface RevenueOptimization {
  venueId: string;
  period: Period;
  recommendations: string[];
  pricingAnalysis: {
    suggestedEntryFee: number;
    expectedUpliftPercent: number;
  };
}

export interface VenuePerformance {
  venueId: string;
  period: Period;
  kpis: {
    visitorSatisfaction: number; // 0..100
    tableUtilization: number; // 0..100
    retentionRate: number; // 0..100
  };
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// In-memory fallback for SSR or tests
const memStore: Record<string, string> = {};

function getItem(key: string): string | null {
  if (isBrowser()) return localStorage.getItem(key);
  return memStore[key] ?? null;
}

function setItem(key: string, value: string) {
  if (isBrowser()) localStorage.setItem(key, value);
  else memStore[key] = value;
}

// Seed data helpers
function seedVenuesIfEmpty() {
  const raw = getItem('dp_venues');
  if (!raw) {
    const seed: Venue[] = [
      {
        id: 'venue-1',
        name: 'Dojo Central',
        location: { address: '100 Main St', city: 'Neo Tokyo', state: 'NT' },
        capacity: 80,
        tables: 12,
        amenities: ['WiFi', 'Cafe', 'Pro Shop'],
        status: 'active',
      },
      {
        id: 'venue-2',
        name: 'Harbor Side Dojo',
        location: { address: '42 Ocean Ave', city: 'Harborview', state: 'HV' },
        capacity: 60,
        tables: 8,
        amenities: ['WiFi', 'Lounge'],
        status: 'maintenance',
      },
    ];
    setItem('dp_venues', JSON.stringify(seed));
  }
}

function seedSchedulesIfEmpty() {
  const raw = getItem('dp_schedules');
  if (!raw) {
    const seed: TournamentSchedule[] = [
      {
        id: 'sch-1',
        venueId: 'venue-1',
        name: 'Weekly 8-Ball',
        type: 'weekly',
        enabled: true,
        autoCreate: false,
        schedule: {
          days: ['Fri'],
          startTime: '18:00',
          endTime: '22:00',
          maxParticipants: 32,
          entryFee: 10,
          prizePool: 250,
        },
      },
      {
        id: 'sch-2',
        venueId: 'venue-1',
        name: 'Saturday Open',
        type: 'weekly',
        enabled: true,
        autoCreate: true,
        schedule: {
          days: ['Sat'],
          startTime: '12:00',
          endTime: '18:00',
          maxParticipants: 64,
          entryFee: 15,
          prizePool: 500,
        },
      },
    ];
    setItem('dp_schedules', JSON.stringify(seed));
  }
}

function readVenues(): Venue[] {
  seedVenuesIfEmpty();
  const raw = getItem('dp_venues');
  return raw ? (JSON.parse(raw) as Venue[]) : [];
}

function writeVenues(vs: Venue[]) {
  setItem('dp_venues', JSON.stringify(vs));
}

function readSchedules(): TournamentSchedule[] {
  seedSchedulesIfEmpty();
  const raw = getItem('dp_schedules');
  return raw ? (JSON.parse(raw) as TournamentSchedule[]) : [];
}

function writeSchedules(ss: TournamentSchedule[]) {
  setItem('dp_schedules', JSON.stringify(ss));
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const enhancedVenueManagementService = {
  // Venues
  async getVenues(): Promise<Venue[]> {
    return readVenues();
  },

  async getVenue(id: string): Promise<Venue | null> {
    return readVenues().find((v) => v.id === id) ?? null;
  },

  async createVenue(input: Omit<Venue, 'id' | 'status'> & { status?: VenueStatusType }): Promise<Venue> {
    const venues = readVenues();
    const newVenue: Venue = {
      id: uid('venue'),
      status: input.status ?? 'active',
      ...input,
    };
    venues.push(newVenue);
    writeVenues(venues);
    return newVenue;
  },

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue | null> {
    const venues = readVenues();
    const idx = venues.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    venues[idx] = { ...venues[idx], ...updates };
    writeVenues(venues);
    return venues[idx];
  },

  // Analytics & Status
  async getVenueAnalytics(venueId: string, period: Period = 'daily'): Promise<VenueAnalytics> {
    const base = 100;
    const mult = period === 'daily' ? 1 : period === 'weekly' ? 5 : 20;
    return {
      venueId,
      period,
      metrics: {
        totalVisitors: base * mult + 50,
        uniqueVisitors: base * mult,
        matchesPlayed: base * mult * 2,
        tournamentsHosted: Math.max(1, Math.floor(mult / 2)),
        revenue: 1000 * mult + 250,
        dojoCoinsEarned: 300 * mult,
        topPlayers: [
          { userId: 'player-1', matches: 40 * mult, wins: 26 * mult },
          { userId: 'player-2', matches: 28 * mult, wins: 17 * mult },
          { userId: 'player-3', matches: 22 * mult, wins: 12 * mult },
        ],
      },
      trends: {
        visitorGrowth: 5.2,
        revenueGrowth: 3.8,
        matchGrowth: 2.1,
        tournamentGrowth: 1.6,
      },
    };
  },

  async getVenueStatus(venueId: string): Promise<VenueStatus> {
    const venue = await this.getVenue(venueId);
    const tables = venue?.tables ?? 10;
    const capacity = venue?.capacity ?? 50;
    return {
      venueId,
      status: venue?.status ?? 'active',
      activeTables: Math.min(tables, Math.max(0, Math.floor(tables * 0.6))),
      currentVisitors: Math.min(capacity, Math.floor(capacity * 0.5)),
      ongoingMatches: Math.floor(tables * 0.25),
      activeTournaments: 1,
      systemHealth: {
        database: true,
        api: true,
        payments: true,
        rtc: true,
      },
      alerts: [],
    };
  },

  async getVenuePerformance(venueId: string, period: Period = 'daily'): Promise<VenuePerformance> {
    return {
      venueId,
      period,
      kpis: {
        visitorSatisfaction: 84,
        tableUtilization: 67,
        retentionRate: 73,
      },
    };
  },

  // Schedules & Tournaments
  async getTournamentSchedules(venueId: string): Promise<TournamentSchedule[]> {
    return readSchedules().filter((s) => s.venueId === venueId);
  },

  async updateTournamentSchedule(id: string, updates: Partial<TournamentSchedule>): Promise<TournamentSchedule | null> {
    const schedules = readSchedules();
    const idx = schedules.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    schedules[idx] = { ...schedules[idx], ...updates };
    writeSchedules(schedules);
    return schedules[idx];
  },

  async createTournament(venueId: string, scheduleId: string): Promise<{ success: boolean; tournamentId?: string; error?: string }> {
    const schedules = readSchedules();
    const idx = schedules.findIndex((s) => s.id === scheduleId && s.venueId === venueId);
    if (idx === -1) return { success: false, error: 'Schedule not found' };
    schedules[idx] = { ...schedules[idx], lastCreated: new Date().toISOString() };
    writeSchedules(schedules);
    return { success: true, tournamentId: uid('t') };
  },

  // Alerts & Health
  async resolveAlert(venueId: string, alertId: string): Promise<boolean> {
    // Using in-memory status; nothing persisted for alerts in this mock
    return true;
  },

  async getVenueHealth(venueId: string): Promise<{ overall: boolean; details: Record<string, boolean> }> {
    return {
      overall: true,
      details: { database: true, api: true, payments: true, rtc: true },
    };
  },
};

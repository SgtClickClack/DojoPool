import { io, Socket } from 'socket.io-client';
// import { realTimeAICommentaryService } from '../ai/RealTimeAICommentaryService';

export type VenueType = 'bar' | 'club' | 'hall' | 'arcade' | 'academy';
export interface Venue {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  venueType: VenueType;
  status: 'active' | 'inactive' | 'maintenance';
  operatingHours: string;
  tables: Table[];
  devices: HardwareDevice[];
  analytics: VenueAnalytics;
  owner: string;
  capacity: number;
  amenities: string[];
  branding: {
    logo: string;
    colors: { primary: string; secondary: string };
    theme: string;
  };
  settings: {
    autoTournaments: boolean;
    maxTournamentSize: number;
    entryFeeRange: { min: number; max: number };
    dojoCoinRewards: boolean;
    aiCommentary: boolean;
  };
  createdAt: Date;
  lastUpdated: Date;
}

export interface Table {
  id: string;
  number: number;
  status: 'available' | 'occupied' | 'maintenance';
  occupancy: number;
  revenue: number;
  lastUsed: Date;
}

export interface HardwareDevice {
  id: string;
  type: 'camera' | 'sensor' | 'display' | 'security' | 'climate' | 'lighting';
  status: 'online' | 'offline' | 'maintenance';
  lastCheck: Date;
  health: number;
  location: string;
}

export interface VenueAnalytics {
  venueId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    totalVisitors: number;
    uniqueVisitors: number;
    matchesPlayed: number;
    tournamentsHosted: number;
    revenue: number;
    dojoCoinsEarned: number;
    averageSessionTime: number;
    peakHours: { hour: number; visitors: number }[];
    popularTables: { tableId: string; usage: number }[];
    topPlayers: { userId: string; matches: number; wins: number }[];
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
  timestamp: Date;
  status: 'online' | 'offline' | 'maintenance';
  activeTables: number;
  currentVisitors: number;
  ongoingMatches: number;
  activeTournaments: number;
  systemHealth: {
    cameras: boolean;
    sensors: boolean;
    network: boolean;
    aiServices: boolean;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

export interface TournamentSchedule {
  id: string;
  venueId: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  schedule: {
    startTime: string;
    endTime: string;
    days: string[];
    maxParticipants: number;
    entryFee: number;
    prizePool: number;
  };
  autoCreate: boolean;
  enabled: boolean;
  lastCreated: Date;
  nextScheduled: Date;
}

export interface RevenueOptimization {
  venueId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  recommendations: Array<{
    id: string;
    type: 'pricing' | 'scheduling' | 'promotion' | 'capacity';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    estimatedRevenueIncrease: number;
    implementationCost: number;
    priority: number;
  }>;
  pricingAnalysis: {
    currentAveragePrice: number;
    recommendedPrice: number;
    competitorAnalysis: Array<{
      competitor: string;
      price: number;
      marketShare: number;
    }>;
  };
  capacityOptimization: {
    currentUtilization: number;
    recommendedCapacity: number;
    peakHours: { hour: number; utilization: number }[];
  };
}

export interface VenuePerformance {
  venueId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  kpis: {
    visitorSatisfaction: number;
    tableUtilization: number;
    tournamentSuccess: number;
    revenuePerVisitor: number;
    costPerMatch: number;
    profitMargin: number;
  };
  benchmarks: {
    industryAverage: {
      visitorSatisfaction: number;
      tableUtilization: number;
      revenuePerVisitor: number;
    };
    topPerformers: {
      visitorSatisfaction: number;
      tableUtilization: number;
      revenuePerVisitor: number;
    };
  };
  improvements: Array<{
    metric: string;
    currentValue: number;
    targetValue: number;
    improvement: number;
    actions: string[];
  }>;
}

export interface MaintenanceTask {
  id: string;
  type: 'hardware' | 'table' | 'venue';
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: Date;
  completedDate?: Date;
  assignedTo?: string;
}

export interface VenueConfig {
  alertThresholds: {
    deviceHealth: number;
    tableOccupancy: number;
    revenue: number;
  };
  climateControl: boolean;
  smartLighting: boolean;
  maintenanceInterval: number;
}

class VenueManagementService {
  private static instance: VenueManagementService;
  private socket: Socket | null = null;
  private isConnected = false;
  private venues: Map<string, Venue> = new Map();
  private analytics: Map<string, VenueAnalytics[]> = new Map();
  private status: Map<string, VenueStatus> = new Map();
  private schedules: Map<string, TournamentSchedule[]> = new Map();
  private optimizations: Map<string, RevenueOptimization[]> = new Map();
  private performance: Map<string, VenuePerformance[]> = new Map();
  private maintenanceTasks: MaintenanceTask[] = [];
  private config: VenueConfig = {
    alertThresholds: {
      deviceHealth: 80,
      tableOccupancy: 90,
      revenue: 10000
    },
    climateControl: true,
    smartLighting: true,
    maintenanceInterval: 30
  };

  private constructor() {
    this.initializeWebSocket();
    this.loadMockData();
  }

  public static getInstance(): VenueManagementService {
    if (!VenueManagementService.instance) {
      VenueManagementService.instance = new VenueManagementService();
    }
    return VenueManagementService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000
      });
      this.socket.on('connect', () => {
        this.isConnected = true;
        this.socket?.emit('venue:join', { service: 'venue' });
      });
      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });
      this.socket.on('venue:update', (venue: Venue) => {
        this.updateVenue(venue);
      });
      this.socket.on('venue:maintenance', (task: MaintenanceTask) => {
        this.updateMaintenanceTask(task);
      });
    } catch (error) {
      this.isConnected = false;
    }
  }

  // Venue Management
  public getVenues(): Venue[] {
    return Array.from(this.venues.values());
  }
  public getVenueById(id: string): Venue | undefined {
    return this.venues.get(id);
  }
  public updateVenue(venue: Venue): void {
    const idx = this.venues.findIndex(v => v.id === venue.id);
    if (idx !== -1) this.venues[idx] = venue;
    else this.venues.push(venue);
  }

  // Table Management
  public getTables(venueId: string): Table[] {
    const venue = this.getVenueById(venueId);
    return venue ? [...venue.tables] : [];
  }
  public updateTable(venueId: string, table: Table): void {
    const venue = this.getVenueById(venueId);
    if (venue) {
      const idx = venue.tables.findIndex(t => t.id === table.id);
      if (idx !== -1) venue.tables[idx] = table;
    }
  }

  // Hardware Management
  public getDevices(venueId: string): HardwareDevice[] {
    const venue = this.getVenueById(venueId);
    return venue ? [...venue.devices] : [];
  }
  public updateDevice(venueId: string, device: HardwareDevice): void {
    const venue = this.getVenueById(venueId);
    if (venue) {
      const idx = venue.devices.findIndex(d => d.id === device.id);
      if (idx !== -1) venue.devices[idx] = device;
    }
  }

  // Analytics
  public getAnalytics(venueId: string): VenueAnalytics | undefined {
    const venue = this.getVenueById(venueId);
    return venue?.analytics;
  }

  // Maintenance
  public getMaintenanceTasks(): MaintenanceTask[] {
    return [...this.maintenanceTasks];
  }
  public updateMaintenanceTask(task: MaintenanceTask): void {
    const idx = this.maintenanceTasks.findIndex(t => t.id === task.id);
    if (idx !== -1) this.maintenanceTasks[idx] = task;
    else this.maintenanceTasks.push(task);
  }

  // Config
  public getConfig(): VenueConfig {
    return { ...this.config };
  }
  public updateConfig(newConfig: Partial<VenueConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Mock Data
  private loadMockData(): void {
    this.venues = [
      {
        id: 'venue1',
        name: 'Cyber Dojo Central',
        location: 'Downtown',
        venueType: 'hall',
        status: 'open',
        operatingHours: '10:00-02:00',
        tables: [
          { id: 't1', number: 1, status: 'available', occupancy: 0, revenue: 1200, lastUsed: new Date() },
          { id: 't2', number: 2, status: 'occupied', occupancy: 2, revenue: 1500, lastUsed: new Date() },
        ],
        devices: [
          { id: 'd1', type: 'camera', status: 'online', lastCheck: new Date(), health: 98, location: 'Table 1' },
          { id: 'd2', type: 'sensor', status: 'online', lastCheck: new Date(), health: 95, location: 'Table 2' },
        ],
        analytics: {
          visitors: 120,
          tableUtilization: 85,
          revenue: 2700,
          avgSessionTime: 52,
          deviceHealth: 96,
          lastUpdated: new Date(),
        },
      },
      {
        id: 'venue2',
        name: 'Neon Billiards Bar',
        location: 'Uptown',
        venueType: 'bar',
        status: 'open',
        operatingHours: '12:00-03:00',
        tables: [
          { id: 't3', number: 1, status: 'available', occupancy: 0, revenue: 900, lastUsed: new Date() },
        ],
        devices: [
          { id: 'd3', type: 'camera', status: 'online', lastCheck: new Date(), health: 97, location: 'Table 1' },
        ],
        analytics: {
          visitors: 80,
          tableUtilization: 0.7,
          revenue: 3000,
          avgSessionTime: 45,
          deviceHealth: 97,
          lastUpdated: new Date()
        }
      },
      {
        id: 'venue3',
        name: 'Arcade Pool Club',
        location: 'Midtown',
        venueType: 'arcade',
        status: 'maintenance',
        operatingHours: '14:00-00:00',
        tables: [
          { id: 't4', number: 1, status: 'maintenance', occupancy: 0, revenue: 0, lastUsed: new Date() },
        ],
        devices: [
          { id: 'd4', type: 'sensor', status: 'offline', lastCheck: new Date(), health: 0, location: 'Table 1' },
        ],
        analytics: {
          visitors: 0,
          tableUtilization: 0,
          revenue: 0,
          avgSessionTime: 0,
          deviceHealth: 0,
          lastUpdated: new Date()
        }
      }
    ];
    this.maintenanceTasks = [
      {
        id: 'm1',
        type: 'hardware',
        description: 'Camera firmware update',
        status: 'pending',
        priority: 'medium',
        scheduledDate: new Date(Date.now() + 86400000),
      },
      {
        id: 'm2',
        type: 'table',
        description: 'Table 2 felt replacement',
        status: 'in_progress',
        priority: 'high',
        scheduledDate: new Date(),
      },
    ];
  }
}

export default VenueManagementService; 
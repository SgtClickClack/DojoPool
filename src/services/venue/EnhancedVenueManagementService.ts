import { realTimeAICommentaryService } from '../ai/RealTimeAICommentaryService';

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
  owner: string;
  status: 'active' | 'inactive' | 'maintenance';
  capacity: number;
  tables: number;
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

class EnhancedVenueManagementService {
  private venues: Map<string, Venue> = new Map();
  private analytics: Map<string, VenueAnalytics[]> = new Map();
  private status: Map<string, VenueStatus> = new Map();
  private schedules: Map<string, TournamentSchedule[]> = new Map();
  private optimizations: Map<string, RevenueOptimization[]> = new Map();
  private performance: Map<string, VenuePerformance[]> = new Map();

  constructor() {
    this.initializeMockData();
    this.startRealTimeMonitoring();
  }

  private initializeMockData(): void {
    // Mock venues
    const mockVenues: Venue[] = [
      {
        id: 'venue-1',
        name: 'The Jade Tiger',
        location: {
          address: '123 Pool Street',
          city: 'Brisbane',
          state: 'QLD',
          country: 'Australia',
          coordinates: { lat: -27.4698, lng: 153.0251 }
        },
        owner: 'owner-1',
        status: 'active',
        capacity: 50,
        tables: 8,
        amenities: ['bar', 'food', 'parking', 'wifi'],
        branding: {
          logo: '/images/venues/jade-tiger-logo.png',
          colors: { primary: '#4CAF50', secondary: '#FFC107' },
          theme: 'asian-fusion'
        },
        settings: {
          autoTournaments: true,
          maxTournamentSize: 32,
          entryFeeRange: { min: 10, max: 100 },
          dojoCoinRewards: true,
          aiCommentary: true
        },
        createdAt: new Date('2024-01-01'),
        lastUpdated: new Date()
      },
      {
        id: 'venue-2',
        name: 'Dragon\'s Den',
        location: {
          address: '456 Cue Avenue',
          city: 'Sydney',
          state: 'NSW',
          country: 'Australia',
          coordinates: { lat: -33.8688, lng: 151.2093 }
        },
        owner: 'owner-2',
        status: 'active',
        capacity: 75,
        tables: 12,
        amenities: ['bar', 'food', 'parking', 'wifi', 'private-rooms'],
        branding: {
          logo: '/images/venues/dragons-den-logo.png',
          colors: { primary: '#F44336', secondary: '#FF9800' },
          theme: 'modern-luxury'
        },
        settings: {
          autoTournaments: true,
          maxTournamentSize: 64,
          entryFeeRange: { min: 20, max: 200 },
          dojoCoinRewards: true,
          aiCommentary: true
        },
        createdAt: new Date('2024-02-01'),
        lastUpdated: new Date()
      }
    ];

    mockVenues.forEach(venue => this.venues.set(venue.id, venue));

    // Initialize analytics, status, and other data
    mockVenues.forEach(venue => {
      this.generateMockAnalytics(venue.id);
      this.generateMockStatus(venue.id);
      this.generateMockSchedules(venue.id);
      this.generateMockOptimizations(venue.id);
      this.generateMockPerformance(venue.id);
    });
  }

  private generateMockAnalytics(venueId: string): void {
    const analytics: VenueAnalytics[] = [];
    const periods: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
    
    periods.forEach(period => {
      analytics.push({
        venueId,
        period,
        date: new Date(),
        metrics: {
          totalVisitors: Math.floor(Math.random() * 1000) + 100,
          uniqueVisitors: Math.floor(Math.random() * 500) + 50,
          matchesPlayed: Math.floor(Math.random() * 200) + 20,
          tournamentsHosted: Math.floor(Math.random() * 10) + 1,
          revenue: Math.floor(Math.random() * 10000) + 1000,
          dojoCoinsEarned: Math.floor(Math.random() * 5000) + 500,
          averageSessionTime: Math.floor(Math.random() * 120) + 60,
          peakHours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            visitors: Math.floor(Math.random() * 50) + 10
          })),
          popularTables: Array.from({ length: 8 }, (_, i) => ({
            tableId: `table-${i + 1}`,
            usage: Math.floor(Math.random() * 100) + 20
          })),
          topPlayers: Array.from({ length: 10 }, (_, i) => ({
            userId: `player-${i + 1}`,
            matches: Math.floor(Math.random() * 50) + 10,
            wins: Math.floor(Math.random() * 30) + 5
          }))
        },
        trends: {
          visitorGrowth: (Math.random() - 0.5) * 20,
          revenueGrowth: (Math.random() - 0.5) * 15,
          matchGrowth: (Math.random() - 0.5) * 25,
          tournamentGrowth: (Math.random() - 0.5) * 30
        }
      });
    });

    this.analytics.set(venueId, analytics);
  }

  private generateMockStatus(venueId: string): void {
    const venue = this.venues.get(venueId);
    if (!venue) return;

    this.status.set(venueId, {
      venueId,
      timestamp: new Date(),
      status: 'online',
      activeTables: Math.floor(Math.random() * venue.tables) + 1,
      currentVisitors: Math.floor(Math.random() * venue.capacity) + 10,
      ongoingMatches: Math.floor(Math.random() * 10) + 1,
      activeTournaments: Math.floor(Math.random() * 3) + 1,
      systemHealth: {
        cameras: Math.random() > 0.1,
        sensors: Math.random() > 0.1,
        network: Math.random() > 0.05,
        aiServices: Math.random() > 0.1
      },
      alerts: Math.random() > 0.7 ? [{
        id: 'alert-1',
        type: 'warning',
        message: 'Table 3 sensor showing unusual readings',
        timestamp: new Date(),
        resolved: false
      }] : []
    });
  }

  private generateMockSchedules(venueId: string): void {
    const schedules: TournamentSchedule[] = [
      {
        id: 'schedule-1',
        venueId,
        name: 'Daily Quick Play',
        type: 'daily',
        schedule: {
          startTime: '18:00',
          endTime: '22:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          maxParticipants: 16,
          entryFee: 15,
          prizePool: 200
        },
        autoCreate: true,
        enabled: true,
        lastCreated: new Date(Date.now() - 86400000),
        nextScheduled: new Date(Date.now() + 86400000)
      },
      {
        id: 'schedule-2',
        venueId,
        name: 'Weekend Championship',
        type: 'weekly',
        schedule: {
          startTime: '14:00',
          endTime: '20:00',
          days: ['saturday'],
          maxParticipants: 32,
          entryFee: 50,
          prizePool: 800
        },
        autoCreate: true,
        enabled: true,
        lastCreated: new Date(Date.now() - 604800000),
        nextScheduled: new Date(Date.now() + 604800000)
      }
    ];

    this.schedules.set(venueId, schedules);
  }

  private generateMockOptimizations(venueId: string): void {
    const optimizations: RevenueOptimization[] = [];
    const periods: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
    
    periods.forEach(period => {
      optimizations.push({
        venueId,
        period,
        date: new Date(),
        recommendations: [
          {
            id: 'rec-1',
            type: 'pricing',
            title: 'Increase weekend tournament entry fees',
            description: 'Analysis shows 15% higher demand on weekends. Recommend increasing entry fees by 20%.',
            impact: 'high',
            estimatedRevenueIncrease: 1200,
            implementationCost: 0,
            priority: 1
          },
          {
            id: 'rec-2',
            type: 'scheduling',
            title: 'Add early morning sessions',
            description: 'Utilization is low before 2 PM. Adding morning sessions could increase revenue by 25%.',
            impact: 'medium',
            estimatedRevenueIncrease: 800,
            implementationCost: 200,
            priority: 2
          },
          {
            id: 'rec-3',
            type: 'promotion',
            title: 'Launch loyalty program',
            description: 'Implement Dojo Coin rewards for regular visitors to increase retention.',
            impact: 'medium',
            estimatedRevenueIncrease: 600,
            implementationCost: 500,
            priority: 3
          }
        ],
        pricingAnalysis: {
          currentAveragePrice: 25,
          recommendedPrice: 30,
          competitorAnalysis: [
            { competitor: 'Pool Palace', price: 28, marketShare: 0.3 },
            { competitor: 'Cue Corner', price: 22, marketShare: 0.2 },
            { competitor: 'Table Time', price: 35, marketShare: 0.1 }
          ]
        },
        capacityOptimization: {
          currentUtilization: 0.65,
          recommendedCapacity: 0.85,
          peakHours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            utilization: Math.random() * 0.8 + 0.2
          }))
        }
      });
    });

    this.optimizations.set(venueId, optimizations);
  }

  private generateMockPerformance(venueId: string): void {
    const performance: VenuePerformance[] = [];
    const periods: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
    
    periods.forEach(period => {
      performance.push({
        venueId,
        period,
        date: new Date(),
        kpis: {
          visitorSatisfaction: Math.random() * 0.3 + 0.7,
          tableUtilization: Math.random() * 0.4 + 0.5,
          tournamentSuccess: Math.random() * 0.2 + 0.8,
          revenuePerVisitor: Math.random() * 20 + 15,
          costPerMatch: Math.random() * 5 + 8,
          profitMargin: Math.random() * 0.2 + 0.3
        },
        benchmarks: {
          industryAverage: {
            visitorSatisfaction: 0.75,
            tableUtilization: 0.6,
            revenuePerVisitor: 18
          },
          topPerformers: {
            visitorSatisfaction: 0.9,
            tableUtilization: 0.85,
            revenuePerVisitor: 25
          }
        },
        improvements: [
          {
            metric: 'visitorSatisfaction',
            currentValue: 0.8,
            targetValue: 0.9,
            improvement: 0.1,
            actions: ['Improve customer service', 'Enhance facilities', 'Add more amenities']
          },
          {
            metric: 'tableUtilization',
            currentValue: 0.65,
            targetValue: 0.8,
            improvement: 0.15,
            actions: ['Optimize scheduling', 'Add promotional events', 'Improve marketing']
          }
        ]
      });
    });

    this.performance.set(venueId, performance);
  }

  private startRealTimeMonitoring(): void {
    setInterval(() => {
      this.venues.forEach(venue => {
        this.updateVenueStatus(venue.id);
      });
    }, 30000); // Update every 30 seconds
  }

  private async updateVenueStatus(venueId: string): Promise<void> {
    const currentStatus = this.status.get(venueId);
    if (!currentStatus) return;

    // Simulate real-time updates
    const updatedStatus: VenueStatus = {
      ...currentStatus,
      timestamp: new Date(),
      currentVisitors: Math.max(0, currentStatus.currentVisitors + Math.floor(Math.random() * 10) - 5),
      activeTables: Math.max(1, currentStatus.activeTables + Math.floor(Math.random() * 3) - 1),
      ongoingMatches: Math.max(0, currentStatus.ongoingMatches + Math.floor(Math.random() * 3) - 1)
    };

    this.status.set(venueId, updatedStatus);

    // Generate AI commentary for significant events
    if (Math.abs(updatedStatus.currentVisitors - currentStatus.currentVisitors) > 10) {
      await realTimeAICommentaryService.generateCommentary({
        type: 'venue_activity',
        data: {
          venueId,
          event: 'visitor_count_change',
          oldValue: currentStatus.currentVisitors,
          newValue: updatedStatus.currentVisitors
        }
      });
    }
  }

  // Public API Methods
  async getVenues(ownerId?: string): Promise<Venue[]> {
    let venues = Array.from(this.venues.values());
    if (ownerId) {
      venues = venues.filter(venue => venue.owner === ownerId);
    }
    return venues;
  }

  async getVenue(venueId: string): Promise<Venue | null> {
    return this.venues.get(venueId) || null;
  }

  async updateVenue(venueId: string, updates: Partial<Venue>): Promise<Venue | null> {
    const venue = this.venues.get(venueId);
    if (!venue) return null;

    const updatedVenue: Venue = {
      ...venue,
      ...updates,
      lastUpdated: new Date()
    };

    this.venues.set(venueId, updatedVenue);
    return updatedVenue;
  }

  async getVenueAnalytics(venueId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<VenueAnalytics | null> {
    const analytics = this.analytics.get(venueId);
    if (!analytics) return null;

    return analytics.find(a => a.period === period) || null;
  }

  async getVenueStatus(venueId: string): Promise<VenueStatus | null> {
    return this.status.get(venueId) || null;
  }

  async getTournamentSchedules(venueId: string): Promise<TournamentSchedule[]> {
    return this.schedules.get(venueId) || [];
  }

  async updateTournamentSchedule(scheduleId: string, updates: Partial<TournamentSchedule>): Promise<TournamentSchedule | null> {
    for (const [venueId, schedules] of this.schedules.entries()) {
      const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
      if (scheduleIndex !== -1) {
        const updatedSchedule: TournamentSchedule = {
          ...schedules[scheduleIndex],
          ...updates
        };
        schedules[scheduleIndex] = updatedSchedule;
        this.schedules.set(venueId, schedules);
        return updatedSchedule;
      }
    }
    return null;
  }

  async getRevenueOptimization(venueId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<RevenueOptimization | null> {
    const optimizations = this.optimizations.get(venueId);
    if (!optimizations) return null;

    return optimizations.find(o => o.period === period) || null;
  }

  async getVenuePerformance(venueId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<VenuePerformance | null> {
    const performance = this.performance.get(venueId);
    if (!performance) return null;

    return performance.find(p => p.period === period) || null;
  }

  async createTournament(venueId: string, scheduleId: string): Promise<{ success: boolean; tournamentId?: string; error?: string }> {
    try {
      const schedules = this.schedules.get(venueId);
      const schedule = schedules?.find(s => s.id === scheduleId);
      
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      if (!schedule.enabled) {
        throw new Error('Schedule is disabled');
      }

      // Create tournament using real API
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: schedule.name,
          venueId: venueId,
          maxParticipants: schedule.schedule.maxParticipants,
          entryFee: schedule.schedule.entryFee,
          prizePool: schedule.schedule.prizePool,
          startTime: schedule.nextScheduled,
          endTime: new Date(schedule.nextScheduled.getTime() + 4 * 60 * 60 * 1000), // 4 hours duration
          format: 'single_elimination',
          rules: 'standard_pool_rules',
          status: 'registration'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tournament');
      }

      const tournament = await response.json();
      
      // Update schedule
      schedule.lastCreated = new Date();
      schedule.nextScheduled = new Date(Date.now() + 86400000); // Next day

      // Generate AI commentary
      await realTimeAICommentaryService.generateCommentary({
        type: 'tournament_created',
        data: {
          venueId,
          tournamentId: tournament.id,
          scheduleName: schedule.name,
          maxParticipants: schedule.schedule.maxParticipants,
          entryFee: schedule.schedule.entryFee
        }
      });

      return { success: true, tournamentId: tournament.id };
    } catch (error) {
      console.error('Tournament creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }

  async getVenueHealth(venueId: string): Promise<{ overall: boolean; details: Record<string, boolean> }> {
    const status = this.status.get(venueId);
    if (!status) {
      return { overall: false, details: {} };
    }

    const details = status.systemHealth;
    const overall = Object.values(details).every(healthy => healthy);

    return { overall, details };
  }

  async resolveAlert(venueId: string, alertId: string): Promise<boolean> {
    const status = this.status.get(venueId);
    if (!status) return false;

    const alert = status.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.status.set(venueId, status);
      return true;
    }

    return false;
  }
}

export const enhancedVenueManagementService = new EnhancedVenueManagementService(); 
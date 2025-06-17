import { BehaviorSubject, Observable } from 'rxjs';

// Franchise Data Structures
export interface Franchise {
  id: string;
  name: string;
  region: string;
  country: string;
  timezone: string;
  currency: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  venues: FranchiseVenue[];
  status: 'active' | 'pending' | 'suspended' | 'closed';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  revenue: {
    monthly: number;
    yearly: number;
    commission: number;
  };
  performance: {
    tournaments: number;
    players: number;
    satisfaction: number;
    rating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FranchiseVenue {
  id: string;
  franchiseId: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: number;
  tables: number;
  equipment: VenueEquipment[];
  status: 'operational' | 'maintenance' | 'closed';
  manager: {
    id: string;
    name: string;
    email: string;
  };
  revenue: number;
  tournaments: number;
}

export interface VenueEquipment {
  id: string;
  type: 'table' | 'camera' | 'sensor' | 'display' | 'audio';
  model: string;
  status: 'operational' | 'maintenance' | 'offline';
  lastMaintenance: Date;
  nextMaintenance: Date;
}

export interface GlobalTournament {
  id: string;
  name: string;
  type: 'regional' | 'national' | 'international' | 'world_championship';
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  prizePool: {
    amount: number;
    currency: string;
    distribution: { position: number; percentage: number }[];
  };
  participants: GlobalParticipant[];
  venues: string[];
  schedule: {
    registration: { start: Date; end: Date };
    tournament: { start: Date; end: Date };
    finals: Date;
  };
  regions: string[];
  status: 'upcoming' | 'registration' | 'active' | 'completed';
}

export interface GlobalParticipant {
  playerId: string;
  franchiseId: string;
  venueId: string;
  region: string;
  ranking: {
    local: number;
    regional: number;
    global: number;
  };
  stats: {
    wins: number;
    losses: number;
    winRate: number;
    averageScore: number;
  };
}

export interface FranchiseAnalytics {
  id: string;
  franchiseId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  metrics: {
    revenue: number;
    tournaments: number;
    players: number;
    newPlayers: number;
    retention: number;
    satisfaction: number;
    utilization: number;
  };
  comparisons: {
    previousPeriod: number;
    regionAverage: number;
    globalAverage: number;
  };
  date: Date;
}

class TournamentFranchiseService {
  private static instance: TournamentFranchiseService;
  private franchisesSubject = new BehaviorSubject<Franchise[]>([]);
  private globalTournamentsSubject = new BehaviorSubject<GlobalTournament[]>([]);
  private analyticsSubject = new BehaviorSubject<FranchiseAnalytics[]>([]);

  private constructor() {
    this.initializeMockData();
    this.startRealTimeUpdates();
  }

  public static getInstance(): TournamentFranchiseService {
    if (!TournamentFranchiseService.instance) {
      TournamentFranchiseService.instance = new TournamentFranchiseService();
    }
    return TournamentFranchiseService.instance;
  }

  // Observable Getters
  public getFranchises(): Observable<Franchise[]> {
    return this.franchisesSubject.asObservable();
  }

  public getGlobalTournaments(): Observable<GlobalTournament[]> {
    return this.globalTournamentsSubject.asObservable();
  }

  public getAnalytics(): Observable<FranchiseAnalytics[]> {
    return this.analyticsSubject.asObservable();
  }

  // Franchise Management
  public async createFranchise(franchiseData: Partial<Franchise>): Promise<Franchise> {
    const franchise: Franchise = {
      id: `franchise_${Date.now()}`,
      name: franchiseData.name || 'New Franchise',
      region: franchiseData.region || 'North America',
      country: franchiseData.country || 'USA',
      timezone: franchiseData.timezone || 'UTC-5',
      currency: franchiseData.currency || 'USD',
      owner: franchiseData.owner || {
        id: `owner_${Date.now()}`,
        name: 'Franchise Owner',
        email: 'owner@example.com',
        phone: '+1-555-0123'
      },
      venues: [],
      status: 'pending',
      tier: 'bronze',
      revenue: { monthly: 0, yearly: 0, commission: 0.15 },
      performance: { tournaments: 0, players: 0, satisfaction: 0, rating: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentFranchises = this.franchisesSubject.value;
    this.franchisesSubject.next([...currentFranchises, franchise]);

    return franchise;
  }

  public async updateFranchise(franchiseId: string, updates: Partial<Franchise>): Promise<Franchise> {
    const franchises = this.franchisesSubject.value;
    const index = franchises.findIndex(f => f.id === franchiseId);
    
    if (index === -1) {
      throw new Error('Franchise not found');
    }

    const updatedFranchise = {
      ...franchises[index],
      ...updates,
      updatedAt: new Date()
    };

    const updatedFranchises = [...franchises];
    updatedFranchises[index] = updatedFranchise;
    this.franchisesSubject.next(updatedFranchises);

    return updatedFranchise;
  }

  public async addVenueToFranchise(franchiseId: string, venueData: Partial<FranchiseVenue>): Promise<FranchiseVenue> {
    const venue: FranchiseVenue = {
      id: `venue_${Date.now()}`,
      franchiseId,
      name: venueData.name || 'New Venue',
      address: venueData.address || '123 Pool St, City, State',
      coordinates: venueData.coordinates || { lat: 40.7128, lng: -74.0060 },
      capacity: venueData.capacity || 50,
      tables: venueData.tables || 8,
      equipment: this.generateEquipment(),
      status: 'operational',
      manager: venueData.manager || {
        id: `manager_${Date.now()}`,
        name: 'Venue Manager',
        email: 'manager@venue.com'
      },
      revenue: 0,
      tournaments: 0
    };

    const franchise = await this.updateFranchise(franchiseId, {
      venues: [...(await this.getFranchiseById(franchiseId)).venues, venue]
    });

    return venue;
  }

  // Global Tournament Management
  public async createGlobalTournament(tournamentData: Partial<GlobalTournament>): Promise<GlobalTournament> {
    const tournament: GlobalTournament = {
      id: `global_tournament_${Date.now()}`,
      name: tournamentData.name || 'Global Championship',
      type: tournamentData.type || 'international',
      format: tournamentData.format || 'single_elimination',
      prizePool: tournamentData.prizePool || {
        amount: 100000,
        currency: 'USD',
        distribution: [
          { position: 1, percentage: 50 },
          { position: 2, percentage: 30 },
          { position: 3, percentage: 20 }
        ]
      },
      participants: [],
      venues: tournamentData.venues || [],
      schedule: tournamentData.schedule || {
        registration: { 
          start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        tournament: {
          start: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
        },
        finals: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
      },
      regions: tournamentData.regions || ['North America', 'Europe', 'Asia'],
      status: 'upcoming'
    };

    const currentTournaments = this.globalTournamentsSubject.value;
    this.globalTournamentsSubject.next([...currentTournaments, tournament]);

    return tournament;
  }

  // Analytics and Reporting
  public async getFranchiseAnalytics(franchiseId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<FranchiseAnalytics[]> {
    const analytics = this.analyticsSubject.value;
    return analytics.filter(a => a.franchiseId === franchiseId && a.period === period);
  }

  public async getRegionalPerformance(region: string): Promise<any> {
    const franchises = this.franchisesSubject.value.filter(f => f.region === region);
    
    return {
      region,
      totalFranchises: franchises.length,
      totalVenues: franchises.reduce((sum, f) => sum + f.venues.length, 0),
      totalRevenue: franchises.reduce((sum, f) => sum + f.revenue.yearly, 0),
      averageRating: franchises.reduce((sum, f) => sum + f.performance.rating, 0) / franchises.length,
      topPerformers: franchises
        .sort((a, b) => b.performance.rating - a.performance.rating)
        .slice(0, 3)
    };
  }

  public async getGlobalStats(): Promise<any> {
    const franchises = this.franchisesSubject.value;
    const tournaments = this.globalTournamentsSubject.value;

    return {
      totalFranchises: franchises.length,
      totalVenues: franchises.reduce((sum, f) => sum + f.venues.length, 0),
      totalRevenue: franchises.reduce((sum, f) => sum + f.revenue.yearly, 0),
      activeTournaments: tournaments.filter(t => t.status === 'active').length,
      regions: [...new Set(franchises.map(f => f.region))],
      countries: [...new Set(franchises.map(f => f.country))],
      topRegions: this.getTopRegions(franchises)
    };
  }

  // Utility Methods
  private async getFranchiseById(franchiseId: string): Promise<Franchise> {
    const franchise = this.franchisesSubject.value.find(f => f.id === franchiseId);
    if (!franchise) {
      throw new Error('Franchise not found');
    }
    return franchise;
  }

  private generateEquipment(): VenueEquipment[] {
    const equipmentTypes = ['table', 'camera', 'sensor', 'display', 'audio'] as const;
    return equipmentTypes.map((type, index) => ({
      id: `equipment_${type}_${Date.now()}_${index}`,
      type,
      model: `${type.toUpperCase()}-Pro-2024`,
      status: 'operational' as const,
      lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000)
    }));
  }

  private getTopRegions(franchises: Franchise[]): any[] {
    const regionStats = franchises.reduce((acc, franchise) => {
      if (!acc[franchise.region]) {
        acc[franchise.region] = {
          region: franchise.region,
          franchises: 0,
          revenue: 0,
          venues: 0,
          rating: 0
        };
      }
      acc[franchise.region].franchises++;
      acc[franchise.region].revenue += franchise.revenue.yearly;
      acc[franchise.region].venues += franchise.venues.length;
      acc[franchise.region].rating += franchise.performance.rating;
      return acc;
    }, {} as any);

    return Object.values(regionStats)
      .map((region: any) => ({
        ...region,
        rating: region.rating / region.franchises
      }))
      .sort((a: any, b: any) => b.revenue - a.revenue);
  }

  private initializeMockData(): void {
    // Initialize with sample franchise data
    const mockFranchises: Franchise[] = [
      {
        id: 'franchise_1',
        name: 'DojoPool Americas',
        region: 'North America',
        country: 'USA',
        timezone: 'UTC-5',
        currency: 'USD',
        owner: {
          id: 'owner_1',
          name: 'John Smith',
          email: 'john.smith@dojopool.com',
          phone: '+1-555-0101'
        },
        venues: [
          {
            id: 'venue_1',
            franchiseId: 'franchise_1',
            name: 'Downtown Dojo',
            address: '123 Main St, New York, NY 10001',
            coordinates: { lat: 40.7128, lng: -74.0060 },
            capacity: 100,
            tables: 12,
            equipment: this.generateEquipment(),
            status: 'operational',
            manager: {
              id: 'manager_1',
              name: 'Alice Johnson',
              email: 'alice@downtown.dojo'
            },
            revenue: 25000,
            tournaments: 45
          }
        ],
        status: 'active',
        tier: 'platinum',
        revenue: { monthly: 45000, yearly: 540000, commission: 0.12 },
        performance: { tournaments: 156, players: 2340, satisfaction: 4.8, rating: 4.9 },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      },
      {
        id: 'franchise_2',
        name: 'DojoPool Europe',
        region: 'Europe',
        country: 'Germany',
        timezone: 'UTC+1',
        currency: 'EUR',
        owner: {
          id: 'owner_2',
          name: 'Hans Mueller',
          email: 'hans.mueller@dojopool.de',
          phone: '+49-30-12345678'
        },
        venues: [
          {
            id: 'venue_2',
            franchiseId: 'franchise_2',
            name: 'Berlin Billiards',
            address: 'Friedrichstraße 100, 10117 Berlin, Germany',
            coordinates: { lat: 52.5200, lng: 13.4050 },
            capacity: 80,
            tables: 10,
            equipment: this.generateEquipment(),
            status: 'operational',
            manager: {
              id: 'manager_2',
              name: 'Greta Schmidt',
              email: 'greta@berlin.dojo'
            },
            revenue: 18000,
            tournaments: 32
          }
        ],
        status: 'active',
        tier: 'gold',
        revenue: { monthly: 32000, yearly: 384000, commission: 0.15 },
        performance: { tournaments: 98, players: 1540, satisfaction: 4.6, rating: 4.7 },
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date()
      }
    ];

    const mockGlobalTournaments: GlobalTournament[] = [
      {
        id: 'global_1',
        name: 'World DojoPool Championship 2025',
        type: 'world_championship',
        format: 'single_elimination',
        prizePool: {
          amount: 500000,
          currency: 'USD',
          distribution: [
            { position: 1, percentage: 40 },
            { position: 2, percentage: 25 },
            { position: 3, percentage: 15 },
            { position: 4, percentage: 10 },
            { position: 5, percentage: 10 }
          ]
        },
        participants: [],
        venues: ['venue_1', 'venue_2'],
        schedule: {
          registration: {
            start: new Date('2025-03-01'),
            end: new Date('2025-03-31')
          },
          tournament: {
            start: new Date('2025-06-01'),
            end: new Date('2025-06-15')
          },
          finals: new Date('2025-06-15')
        },
        regions: ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'],
        status: 'registration'
      }
    ];

    this.franchisesSubject.next(mockFranchises);
    this.globalTournamentsSubject.next(mockGlobalTournaments);
    this.generateMockAnalytics();
  }

  private generateMockAnalytics(): void {
    const franchises = this.franchisesSubject.value;
    const analytics: FranchiseAnalytics[] = [];

    franchises.forEach(franchise => {
      const periods: Array<'daily' | 'weekly' | 'monthly' | 'yearly'> = ['daily', 'weekly', 'monthly', 'yearly'];
      
      periods.forEach(period => {
        analytics.push({
          id: `analytics_${franchise.id}_${period}`,
          franchiseId: franchise.id,
          period,
          metrics: {
            revenue: franchise.revenue.monthly * (period === 'yearly' ? 12 : period === 'monthly' ? 1 : period === 'weekly' ? 0.25 : 0.033),
            tournaments: Math.floor(franchise.performance.tournaments * (period === 'yearly' ? 1 : period === 'monthly' ? 0.083 : period === 'weekly' ? 0.019 : 0.0027)),
            players: Math.floor(franchise.performance.players * (period === 'yearly' ? 1 : period === 'monthly' ? 0.083 : period === 'weekly' ? 0.019 : 0.0027)),
            newPlayers: Math.floor(franchise.performance.players * 0.1 * (period === 'yearly' ? 1 : period === 'monthly' ? 0.083 : period === 'weekly' ? 0.019 : 0.0027)),
            retention: 0.85 + Math.random() * 0.1,
            satisfaction: franchise.performance.satisfaction,
            utilization: 0.7 + Math.random() * 0.25
          },
          comparisons: {
            previousPeriod: -5 + Math.random() * 15,
            regionAverage: -2 + Math.random() * 8,
            globalAverage: -3 + Math.random() * 10
          },
          date: new Date()
        });
      });
    });

    this.analyticsSubject.next(analytics);
  }

  private startRealTimeUpdates(): void {
    // Simulate real-time updates every 30 seconds
    setInterval(() => {
      this.updateFranchiseMetrics();
    }, 30000);
  }

  private updateFranchiseMetrics(): void {
    const franchises = this.franchisesSubject.value;
    const updatedFranchises = franchises.map(franchise => ({
      ...franchise,
      performance: {
        ...franchise.performance,
        rating: Math.max(0, Math.min(5, franchise.performance.rating + (Math.random() - 0.5) * 0.1)),
        satisfaction: Math.max(0, Math.min(5, franchise.performance.satisfaction + (Math.random() - 0.5) * 0.05))
      },
      updatedAt: new Date()
    }));

    this.franchisesSubject.next(updatedFranchises);
  }
}

export default TournamentFranchiseService;
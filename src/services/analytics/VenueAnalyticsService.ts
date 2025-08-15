import { BrowserEventEmitter } from '';
import { io, Socket } from 'socket.io-client';

// Venue Analytics Interfaces
export interface VenueMetrics {
  id: string;
  venueId: string;
  timestamp: Date;
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    growthRate: number;
  };
  playerEngagement: {
    activePlayers: number;
    newPlayers: number;
    returningPlayers: number;
    averageSessionTime: number;
    playerRetentionRate: number;
  };
  tournamentPerformance: {
    totalTournaments: number;
    activeTournaments: number;
    averagePrizePool: number;
    tournamentSuccessRate: number;
    playerSatisfactionScore: number;
  };
  equipmentHealth: {
    tableUtilization: number;
    equipmentStatus: 'optimal' | 'good' | 'needs_maintenance' | 'critical';
    maintenanceAlerts: number;
    uptimePercentage: number;
  };
  operationalMetrics: {
    peakHours: string[];
    averageWaitTime: number;
    tableAvailability: number;
    staffEfficiency: number;
  };
}

export interface VenueComparison {
  venueId: string;
  comparisonVenues: string[];
  metrics: {
    revenueComparison: {
      rank: number;
      percentile: number;
      difference: number;
    };
    playerEngagementComparison: {
      rank: number;
      percentile: number;
      difference: number;
    };
    tournamentPerformanceComparison: {
      rank: number;
      percentile: number;
      difference: number;
    };
  };
  insights: string[];
  recommendations: string[];
}

export interface PredictiveInsights {
  venueId: string;
  predictions: {
    revenueForecast: {
      nextWeek: number;
      nextMonth: number;
      nextQuarter: number;
      confidence: number;
    };
    playerGrowth: {
      expectedNewPlayers: number;
      retentionImprovement: number;
      churnRisk: number;
      confidence: number;
    };
    tournamentSuccess: {
      expectedTournaments: number;
      successProbability: number;
      optimalPrizePool: number;
      confidence: number;
    };
    equipmentNeeds: {
      maintenanceSchedule: Date[];
      replacementRecommendations: string[];
      costEstimates: number;
    };
  };
  optimizationRecommendations: {
    revenue: string[];
    playerEngagement: string[];
    tournamentManagement: string[];
    operationalEfficiency: string[];
  };
}

export interface VenueHealthStatus {
  venueId: string;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  systemStatus: {
    database: 'online' | 'degraded' | 'offline';
    api: 'online' | 'degraded' | 'offline';
    websocket: 'online' | 'degraded' | 'offline';
    aiServices: 'online' | 'degraded' | 'offline';
  };
  equipmentStatus: {
    tables: {
      total: number;
      operational: number;
      maintenance: number;
      offline: number;
    };
    cameras: {
      total: number;
      operational: number;
      maintenance: number;
      offline: number;
    };
    sensors: {
      total: number;
      operational: number;
      maintenance: number;
      offline: number;
    };
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
  lastUpdated: Date;
}

export interface VenueROIAnalysis {
  venueId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  revenue: {
    total: number;
    fromTournaments: number;
    fromEquipment: number;
    fromServices: number;
    growthRate: number;
  };
  costs: {
    total: number;
    equipment: number;
    staff: number;
    utilities: number;
    maintenance: number;
    marketing: number;
  };
  roi: {
    overall: number;
    tournamentROI: number;
    equipmentROI: number;
    marketingROI: number;
  };
  playerMetrics: {
    acquisitionCost: number;
    lifetimeValue: number;
    retentionCost: number;
    churnRate: number;
  };
  recommendations: string[];
}

class VenueAnalyticsService extends BrowserEventEmitter {
  private static instance: VenueAnalyticsService;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private venueMetrics: Map<string, VenueMetrics> = new Map();
  private venueComparisons: Map<string, VenueComparison> = new Map();
  private predictiveInsights: Map<string, PredictiveInsights> = new Map();
  private healthStatus: Map<string, VenueHealthStatus> = new Map();
  private roiAnalysis: Map<string, VenueROIAnalysis> = new Map();

  private constructor() {
    super();
    this.initializeWebSocket();
  }

  public static getInstance(): VenueAnalyticsService {
    if (!VenueAnalyticsService.instance) {
      VenueAnalyticsService.instance = new VenueAnalyticsService();
    }
    return VenueAnalyticsService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('/socket.io', {
        transports: ['websocket'],
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.emit('connected');
        console.log('VenueAnalyticsService: Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.emit('disconnected');
        console.log('VenueAnalyticsService: Disconnected from WebSocket server');
      });

      this.socket.on('venueMetricsUpdate', (data: VenueMetrics) => {
        this.venueMetrics.set(data.venueId, data);
        this.emit('metricsUpdate', data);
      });

      this.socket.on('venueComparisonUpdate', (data: VenueComparison) => {
        this.venueComparisons.set(data.venueId, data);
        this.emit('comparisonUpdate', data);
      });

      this.socket.on('predictiveInsightsUpdate', (data: PredictiveInsights) => {
        this.predictiveInsights.set(data.venueId, data);
        this.emit('insightsUpdate', data);
      });

      this.socket.on('healthStatusUpdate', (data: VenueHealthStatus) => {
        this.healthStatus.set(data.venueId, data);
        this.emit('healthUpdate', data);
      });

      this.socket.on('roiAnalysisUpdate', (data: VenueROIAnalysis) => {
        this.roiAnalysis.set(data.venueId, data);
        this.emit('roiUpdate', data);
      });

    } catch (error) {
      console.error('VenueAnalyticsService: WebSocket initialization failed:', error);
    }
  }

  // Venue Metrics Methods
  public async getVenueMetrics(venueId: string): Promise<VenueMetrics | null> {
    if (this.venueMetrics.has(venueId)) {
      return this.venueMetrics.get(venueId) || null;
    }
    
    // Mock data for demonstration
    const mockMetrics: VenueMetrics = {
      id: `metrics_${venueId}`,
      venueId,
      timestamp: new Date(),
      revenue: {
        daily: 2500,
        weekly: 17500,
        monthly: 75000,
        yearly: 900000,
        growthRate: 12.5,
      },
      playerEngagement: {
        activePlayers: 45,
        newPlayers: 8,
        returningPlayers: 37,
        averageSessionTime: 2.5,
        playerRetentionRate: 78.5,
      },
      tournamentPerformance: {
        totalTournaments: 24,
        activeTournaments: 3,
        averagePrizePool: 500,
        tournamentSuccessRate: 92.3,
        playerSatisfactionScore: 4.6,
      },
      equipmentHealth: {
        tableUtilization: 85.2,
        equipmentStatus: 'good',
        maintenanceAlerts: 2,
        uptimePercentage: 98.7,
      },
      operationalMetrics: {
        peakHours: ['19:00', '20:00', '21:00'],
        averageWaitTime: 15,
        tableAvailability: 75,
        staffEfficiency: 88.5,
      },
    };

    this.venueMetrics.set(venueId, mockMetrics);
    return mockMetrics;
  }

  public async getVenueComparison(venueId: string): Promise<VenueComparison | null> {
    if (this.venueComparisons.has(venueId)) {
      return this.venueComparisons.get(venueId) || null;
    }

    // Mock comparison data
    const mockComparison: VenueComparison = {
      venueId,
      comparisonVenues: ['venue_001', 'venue_002', 'venue_003'],
      metrics: {
        revenueComparison: {
          rank: 2,
          percentile: 75,
          difference: 12.5,
        },
        playerEngagementComparison: {
          rank: 1,
          percentile: 90,
          difference: 8.3,
        },
        tournamentPerformanceComparison: {
          rank: 3,
          percentile: 65,
          difference: -5.2,
        },
      },
      insights: [
        'Revenue performance is above average for similar venues',
        'Player engagement is exceptional compared to competitors',
        'Tournament performance has room for improvement',
      ],
      recommendations: [
        'Increase tournament frequency to improve performance metrics',
        'Leverage high player engagement for revenue optimization',
        'Consider expanding tournament prize pools to attract more players',
      ],
    };

    this.venueComparisons.set(venueId, mockComparison);
    return mockComparison;
  }

  public async getPredictiveInsights(venueId: string): Promise<PredictiveInsights | null> {
    if (this.predictiveInsights.has(venueId)) {
      return this.predictiveInsights.get(venueId) || null;
    }

    // Mock predictive insights
    const mockInsights: PredictiveInsights = {
      venueId,
      predictions: {
        revenueForecast: {
          nextWeek: 18250,
          nextMonth: 78500,
          nextQuarter: 240000,
          confidence: 85.5,
        },
        playerGrowth: {
          expectedNewPlayers: 12,
          retentionImprovement: 5.2,
          churnRisk: 15.3,
          confidence: 78.9,
        },
        tournamentSuccess: {
          expectedTournaments: 6,
          successProbability: 88.7,
          optimalPrizePool: 750,
          confidence: 82.1,
        },
        equipmentNeeds: {
          maintenanceSchedule: [
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          ],
          replacementRecommendations: ['Table felt replacement', 'Camera lens cleaning'],
          costEstimates: 2500,
        },
      },
      optimizationRecommendations: {
        revenue: [
          'Implement dynamic pricing during peak hours',
          'Introduce membership tiers for recurring revenue',
          'Optimize tournament scheduling for maximum participation',
        ],
        playerEngagement: [
          'Launch loyalty program to increase retention',
          'Add social features to encourage community building',
          'Implement gamification elements for player motivation',
        ],
        tournamentManagement: [
          'Increase tournament frequency during weekends',
          'Diversify tournament formats to attract different player types',
          'Implement tiered tournament system',
        ],
        operationalEfficiency: [
          'Optimize staff scheduling based on peak hours',
          'Implement automated equipment monitoring',
          'Streamline tournament registration process',
        ],
      },
    };

    this.predictiveInsights.set(venueId, mockInsights);
    return mockInsights;
  }

  public async getHealthStatus(venueId: string): Promise<VenueHealthStatus | null> {
    if (this.healthStatus.has(venueId)) {
      return this.healthStatus.get(venueId) || null;
    }

    // Mock health status
    const mockHealth: VenueHealthStatus = {
      venueId,
      overallHealth: 'good',
      systemStatus: {
        database: 'online',
        api: 'online',
        websocket: 'online',
        aiServices: 'online',
      },
      equipmentStatus: {
        tables: {
          total: 8,
          operational: 7,
          maintenance: 1,
          offline: 0,
        },
        cameras: {
          total: 16,
          operational: 15,
          maintenance: 1,
          offline: 0,
        },
        sensors: {
          total: 24,
          operational: 23,
          maintenance: 1,
          offline: 0,
        },
      },
      alerts: {
        critical: 0,
        warning: 2,
        info: 5,
      },
      lastUpdated: new Date(),
    };

    this.healthStatus.set(venueId, mockHealth);
    return mockHealth;
  }

  public async getROIAnalysis(venueId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<VenueROIAnalysis | null> {
    const key = `${venueId}_${period}`;
    if (this.roiAnalysis.has(key)) {
      return this.roiAnalysis.get(key) || null;
    }

    // Mock ROI analysis
    const mockROI: VenueROIAnalysis = {
      venueId,
      period,
      revenue: {
        total: 75000,
        fromTournaments: 45000,
        fromEquipment: 25000,
        fromServices: 5000,
        growthRate: 12.5,
      },
      costs: {
        total: 45000,
        equipment: 15000,
        staff: 20000,
        utilities: 5000,
        maintenance: 3000,
        marketing: 2000,
      },
      roi: {
        overall: 66.7,
        tournamentROI: 80.0,
        equipmentROI: 66.7,
        marketingROI: 150.0,
      },
      playerMetrics: {
        acquisitionCost: 25,
        lifetimeValue: 150,
        retentionCost: 10,
        churnRate: 15.3,
      },
      recommendations: [
        'Increase marketing budget to improve player acquisition',
        'Optimize tournament scheduling for better ROI',
        'Implement cost-saving measures in utilities and maintenance',
        'Focus on player retention to improve lifetime value',
      ],
    };

    this.roiAnalysis.set(key, mockROI);
    return mockROI;
  }

  // Real-time Updates
  public subscribeToVenueUpdates(venueId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribeToVenue', { venueId });
    }
  }

  public unsubscribeFromVenueUpdates(venueId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribeFromVenue', { venueId });
    }
  }

  // Utility Methods
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export default VenueAnalyticsService; 

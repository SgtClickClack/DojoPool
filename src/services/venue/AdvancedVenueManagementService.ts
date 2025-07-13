import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';

export interface VenuePerformance {
  venueId: string;
  venueName: string;
  totalMatches: number;
  totalPlayers: number;
  averageMatchDuration: number;
  revenue: number;
  playerEngagement: number;
  tableUtilization: number;
  peakHours: string[];
  popularGameTypes: string[];
  averageRating: number;
  totalReviews: number;
  lastUpdated: Date;
}

export interface VenueAnalytics {
  venueId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  metrics: {
    totalRevenue: number;
    totalMatches: number;
    uniquePlayers: number;
    averageSessionDuration: number;
    tableUtilizationRate: number;
    playerRetentionRate: number;
    averageRating: number;
    customerSatisfaction: number;
  };
  trends: {
    revenue: number;
    playerGrowth: number;
    engagement: number;
    utilization: number;
  };
  insights: string[];
  recommendations: string[];
}

export interface TablePerformance {
  tableId: string;
  venueId: string;
  tableNumber: string;
  totalMatches: number;
  totalHours: number;
  utilizationRate: number;
  averageRating: number;
  revenue: number;
  maintenanceHistory: MaintenanceRecord[];
  lastMaintenance: Date;
  status: 'active' | 'maintenance' | 'inactive';
}

export interface MaintenanceRecord {
  id: string;
  tableId: string;
  type: 'routine' | 'repair' | 'upgrade';
  description: string;
  cost: number;
  duration: number;
  technician: string;
  date: Date;
  notes: string;
}

export interface PlayerEngagement {
  venueId: string;
  playerId: string;
  totalVisits: number;
  totalMatches: number;
  totalSpent: number;
  averageSessionDuration: number;
  lastVisit: Date;
  favoriteTable: string;
  preferredTime: string;
  engagementScore: number;
}

export interface RevenueAnalytics {
  venueId: string;
  period: string;
  totalRevenue: number;
  revenueBySource: {
    tableRental: number;
    foodAndBeverage: number;
    merchandise: number;
    tournaments: number;
    membership: number;
  };
  revenueByTime: {
    hourly: { [hour: string]: number };
    daily: { [day: string]: number };
    monthly: { [month: string]: number };
  };
  topRevenueDrivers: string[];
  growthRate: number;
}

export interface VenueOptimization {
  venueId: string;
  recommendations: OptimizationRecommendation[];
  implementationPlan: ImplementationStep[];
  expectedImpact: {
    revenueIncrease: number;
    efficiencyGain: number;
    customerSatisfaction: number;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface OptimizationRecommendation {
  id: string;
  category: 'layout' | 'pricing' | 'staffing' | 'equipment' | 'marketing' | 'operations';
  title: string;
  description: string;
  impact: {
    revenue: number;
    efficiency: number;
    satisfaction: number;
  };
  cost: number;
  implementationTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ImplementationStep {
  id: string;
  recommendationId: string;
  step: string;
  duration: number;
  cost: number;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface VenueConfig {
  enabled: boolean;
  realTimeTracking: boolean;
  performanceAnalytics: boolean;
  revenueTracking: boolean;
  playerEngagement: boolean;
  optimization: boolean;
  updateInterval: number;
  retentionPeriod: number;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
}

export interface VenueMetrics {
  totalVenues: number;
  activeVenues: number;
  averageRevenue: number;
  averageUtilization: number;
  totalRevenue: number;
  topPerformers: string[];
  mostImproved: string[];
  averageRating: number;
  lastActivity: Date;
}

class AdvancedVenueManagementService extends BrowserEventEmitter {
  private static instance: AdvancedVenueManagementService;
  private config: VenueConfig;
  private metrics: VenueMetrics;
  private venuePerformances: Map<string, VenuePerformance>;
  private venueAnalytics: Map<string, VenueAnalytics[]>;
  private tablePerformances: Map<string, TablePerformance[]>;
  private playerEngagements: Map<string, PlayerEngagement[]>;
  private revenueAnalytics: Map<string, RevenueAnalytics[]>;
  private venueOptimizations: Map<string, VenueOptimization[]>;

  constructor() {
    super();
    this.venuePerformances = new Map();
    this.venueAnalytics = new Map();
    this.tablePerformances = new Map();
    this.playerEngagements = new Map();
    this.revenueAnalytics = new Map();
    this.venueOptimizations = new Map();

    this.config = {
      enabled: true,
      realTimeTracking: true,
      performanceAnalytics: true,
      revenueTracking: true,
      playerEngagement: true,
      optimization: true,
      updateInterval: 5000,
      retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      notificationSettings: {
        email: false,
        sms: false,
        push: true,
        webhook: false
      }
    };

    this.metrics = {
      totalVenues: 0,
      activeVenues: 0,
      averageRevenue: 0,
      averageUtilization: 0,
      totalRevenue: 0,
      topPerformers: [],
      mostImproved: [],
      averageRating: 0,
      lastActivity: new Date()
    };

    this.initializeService();
  }

  public static getInstance(): AdvancedVenueManagementService {
    if (!AdvancedVenueManagementService.instance) {
      AdvancedVenueManagementService.instance = new AdvancedVenueManagementService();
    }
    return AdvancedVenueManagementService.instance;
  }

  private initializeService(): void {
    console.log('Advanced Venue Management Service initialized');
    this.loadSampleData();
    this.startPeriodicUpdates();
  }

  private loadSampleData(): void {
    // Sample venue performances
    const sampleVenues: VenuePerformance[] = [
      {
        venueId: 'venue-1',
        venueName: 'The Jade Tiger',
        totalMatches: 1250,
        totalPlayers: 450,
        averageMatchDuration: 28.5,
        revenue: 125000,
        playerEngagement: 85.2,
        tableUtilization: 78.5,
        peakHours: ['19:00', '20:00', '21:00'],
        popularGameTypes: ['8-ball', '9-ball', 'snooker'],
        averageRating: 4.6,
        totalReviews: 89,
        lastUpdated: new Date()
      },
      {
        venueId: 'venue-2',
        venueName: 'Pool Paradise',
        totalMatches: 980,
        totalPlayers: 320,
        averageMatchDuration: 32.1,
        revenue: 89000,
        playerEngagement: 72.8,
        tableUtilization: 65.2,
        peakHours: ['18:00', '19:00', '22:00'],
        popularGameTypes: ['8-ball', 'straight-pool'],
        averageRating: 4.2,
        totalReviews: 67,
        lastUpdated: new Date()
      }
    ];

    sampleVenues.forEach(venue => {
      this.venuePerformances.set(venue.venueId, venue);
    });

    this.updateMetrics();
  }

  private startPeriodicUpdates(): void {
    if (this.config.realTimeTracking) {
      setInterval(() => {
        this.updateMetrics();
        this.emit('metricsUpdated', this.metrics);
      }, this.config.updateInterval);
    }
  }

  // Venue Performance Management
  public async updateVenuePerformance(
    venueId: string, 
    performanceData: any
  ): Promise<VenuePerformance> {
    const existing = this.venuePerformances.get(venueId);
    const performance = existing || this.createNewVenuePerformance(venueId, performanceData.venueName);

    // Update performance based on data
    performance.totalMatches += performanceData.matches || 0;
    performance.totalPlayers = Math.max(performance.totalPlayers, performanceData.uniquePlayers || 0);
    performance.averageMatchDuration = this.calculateAverageDuration(performance, performanceData.matchDuration);
    performance.revenue += performanceData.revenue || 0;
    performance.playerEngagement = this.calculateEngagement(performance, performanceData);
    performance.tableUtilization = this.calculateUtilization(performance, performanceData);
    performance.lastUpdated = new Date();

    this.venuePerformances.set(venueId, performance);
    this.emit('performanceUpdated', performance);

    return performance;
  }

  private createNewVenuePerformance(venueId: string, venueName: string): VenuePerformance {
    return {
      venueId,
      venueName,
      totalMatches: 0,
      totalPlayers: 0,
      averageMatchDuration: 0,
      revenue: 0,
      playerEngagement: 0,
      tableUtilization: 0,
      peakHours: [],
      popularGameTypes: [],
      averageRating: 0,
      totalReviews: 0,
      lastUpdated: new Date()
    };
  }

  private calculateAverageDuration(performance: VenuePerformance, newDuration: number): number {
    const totalDuration = performance.averageMatchDuration * performance.totalMatches + newDuration;
    return totalDuration / (performance.totalMatches + 1);
  }

  private calculateEngagement(performance: VenuePerformance, data: any): number {
    // Calculate engagement based on various factors
    const factors = [
      data.returnVisits || 0,
      data.sessionDuration || 0,
      data.socialInteractions || 0,
      data.tournamentParticipation || 0
    ];
    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private calculateUtilization(performance: VenuePerformance, data: any): number {
    const totalHours = data.totalHours || 24;
    const usedHours = data.usedHours || 0;
    return (usedHours / totalHours) * 100;
  }

  // Venue Analytics
  public async generateVenueAnalytics(
    venueId: string,
    period: VenueAnalytics['period'],
    startDate: Date,
    endDate: Date
  ): Promise<VenueAnalytics> {
    const performance = this.venuePerformances.get(venueId);
    if (!performance) {
      throw new Error('Venue performance not found');
    }

    const analytics: VenueAnalytics = {
      venueId,
      period,
      startDate,
      endDate,
      metrics: {
        totalRevenue: performance.revenue,
        totalMatches: performance.totalMatches,
        uniquePlayers: performance.totalPlayers,
        averageSessionDuration: performance.averageMatchDuration,
        tableUtilizationRate: performance.tableUtilization,
        playerRetentionRate: this.calculateRetentionRate(venueId),
        averageRating: performance.averageRating,
        customerSatisfaction: this.calculateSatisfaction(performance)
      },
      trends: {
        revenue: this.calculateRevenueTrend(venueId),
        playerGrowth: this.calculatePlayerGrowth(venueId),
        engagement: this.calculateEngagementTrend(venueId),
        utilization: this.calculateUtilizationTrend(venueId)
      },
      insights: this.generateInsights(performance),
      recommendations: this.generateRecommendations(performance)
    };

    if (!this.venueAnalytics.has(venueId)) {
      this.venueAnalytics.set(venueId, []);
    }
    this.venueAnalytics.get(venueId)!.push(analytics);

    this.emit('analyticsGenerated', analytics);
    return analytics;
  }

  private calculateRetentionRate(venueId: string): number {
    // Mock calculation - would use actual player data
    return 75 + Math.random() * 20;
  }

  private calculateSatisfaction(performance: VenuePerformance): number {
    return performance.averageRating * 20; // Convert 5-star to percentage
  }

  private calculateRevenueTrend(venueId: string): number {
    // Mock calculation - would use historical data
    return 5 + Math.random() * 10;
  }

  private calculatePlayerGrowth(venueId: string): number {
    // Mock calculation - would use historical data
    return 3 + Math.random() * 8;
  }

  private calculateEngagementTrend(venueId: string): number {
    // Mock calculation - would use historical data
    return 2 + Math.random() * 6;
  }

  private calculateUtilizationTrend(venueId: string): number {
    // Mock calculation - would use historical data
    return 1 + Math.random() * 5;
  }

  private generateInsights(performance: VenuePerformance): string[] {
    const insights: string[] = [];
    
    if (performance.tableUtilization > 80) {
      insights.push('High table utilization - consider expanding capacity');
    }
    if (performance.playerEngagement < 70) {
      insights.push('Player engagement below target - review engagement strategies');
    }
    if (performance.averageRating < 4.0) {
      insights.push('Customer satisfaction needs improvement');
    }
    if (performance.revenue > 100000) {
      insights.push('Strong revenue performance - consider reinvestment opportunities');
    }
    
    return insights;
  }

  private generateRecommendations(performance: VenuePerformance): string[] {
    const recommendations: string[] = [];
    
    if (performance.tableUtilization > 80) {
      recommendations.push('Add additional tables to meet demand');
    }
    if (performance.playerEngagement < 70) {
      recommendations.push('Implement loyalty program to increase engagement');
    }
    if (performance.averageRating < 4.0) {
      recommendations.push('Improve customer service training');
    }
    if (performance.revenue > 100000) {
      recommendations.push('Consider venue expansion or new location');
    }
    
    return recommendations;
  }

  // Table Performance
  public async updateTablePerformance(
    tableId: string,
    venueId: string,
    performanceData: any
  ): Promise<TablePerformance> {
    const tables = this.tablePerformances.get(venueId) || [];
    let table = tables.find(t => t.tableId === tableId);

    if (!table) {
      table = this.createNewTablePerformance(tableId, venueId);
      tables.push(table);
    }

    // Update table performance
    table.totalMatches += performanceData.matches || 0;
    table.totalHours += performanceData.hours || 0;
    table.utilizationRate = this.calculateTableUtilization(table);
    table.revenue += performanceData.revenue || 0;
    table.lastMaintenance = new Date();

    this.tablePerformances.set(venueId, tables);
    this.emit('tablePerformanceUpdated', table);

    return table;
  }

  private createNewTablePerformance(tableId: string, venueId: string): TablePerformance {
    return {
      tableId,
      venueId,
      tableNumber: `Table ${tableId.split('-')[1]}`,
      totalMatches: 0,
      totalHours: 0,
      utilizationRate: 0,
      averageRating: 0,
      revenue: 0,
      maintenanceHistory: [],
      lastMaintenance: new Date(),
      status: 'active'
    };
  }

  private calculateTableUtilization(table: TablePerformance): number {
    const totalPossibleHours = 24 * 30; // 30 days
    return (table.totalHours / totalPossibleHours) * 100;
  }

  public async addMaintenanceRecord(
    tableId: string,
    venueId: string,
    maintenanceData: Omit<MaintenanceRecord, 'id' | 'date'>
  ): Promise<MaintenanceRecord> {
    const tables = this.tablePerformances.get(venueId) || [];
    const table = tables.find(t => t.tableId === tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    const record: MaintenanceRecord = {
      ...maintenanceData,
      id: this.generateId(),
      date: new Date()
    };

    table.maintenanceHistory.push(record);
    table.lastMaintenance = new Date();

    this.emit('maintenanceRecordAdded', record);
    return record;
  }

  // Player Engagement
  public async updatePlayerEngagement(
    venueId: string,
    playerId: string,
    engagementData: any
  ): Promise<PlayerEngagement> {
    const engagements = this.playerEngagements.get(venueId) || [];
    let engagement = engagements.find(e => e.playerId === playerId);

    if (!engagement) {
      engagement = this.createNewPlayerEngagement(venueId, playerId);
      engagements.push(engagement);
    }

    // Update engagement data
    engagement.totalVisits += engagementData.visits || 0;
    engagement.totalMatches += engagementData.matches || 0;
    engagement.totalSpent += engagementData.spent || 0;
    engagement.averageSessionDuration = this.calculateAverageSession(engagement, engagementData.duration);
    engagement.lastVisit = new Date();
    engagement.engagementScore = this.calculateEngagementScore(engagement);

    this.playerEngagements.set(venueId, engagements);
    this.emit('playerEngagementUpdated', engagement);

    return engagement;
  }

  private createNewPlayerEngagement(venueId: string, playerId: string): PlayerEngagement {
    return {
      venueId,
      playerId,
      totalVisits: 0,
      totalMatches: 0,
      totalSpent: 0,
      averageSessionDuration: 0,
      lastVisit: new Date(),
      favoriteTable: '',
      preferredTime: '',
      engagementScore: 0
    };
  }

  private calculateAverageSession(engagement: PlayerEngagement, newDuration: number): number {
    const totalDuration = engagement.averageSessionDuration * engagement.totalVisits + newDuration;
    return totalDuration / (engagement.totalVisits + 1);
  }

  private calculateEngagementScore(engagement: PlayerEngagement): number {
    const factors = [
      engagement.totalVisits * 10,
      engagement.totalMatches * 5,
      engagement.totalSpent * 0.1,
      engagement.averageSessionDuration * 2
    ];
    return Math.min(100, factors.reduce((sum, factor) => sum + factor, 0));
  }

  // Revenue Analytics
  public async generateRevenueAnalytics(
    venueId: string,
    period: string
  ): Promise<RevenueAnalytics> {
    const performance = this.venuePerformances.get(venueId);
    if (!performance) {
      throw new Error('Venue performance not found');
    }

    const analytics: RevenueAnalytics = {
      venueId,
      period,
      totalRevenue: performance.revenue,
      revenueBySource: {
        tableRental: performance.revenue * 0.6,
        foodAndBeverage: performance.revenue * 0.25,
        merchandise: performance.revenue * 0.1,
        tournaments: performance.revenue * 0.03,
        membership: performance.revenue * 0.02
      },
      revenueByTime: {
        hourly: this.generateHourlyRevenue(),
        daily: this.generateDailyRevenue(),
        monthly: this.generateMonthlyRevenue()
      },
      topRevenueDrivers: ['Table Rental', 'Food & Beverage', 'Tournaments'],
      growthRate: this.calculateRevenueGrowth(venueId)
    };

    if (!this.revenueAnalytics.has(venueId)) {
      this.revenueAnalytics.set(venueId, []);
    }
    this.revenueAnalytics.get(venueId)!.push(analytics);

    this.emit('revenueAnalyticsGenerated', analytics);
    return analytics;
  }

  private generateHourlyRevenue(): { [hour: string]: number } {
    const hourly: { [hour: string]: number } = {};
    for (let i = 0; i < 24; i++) {
      hourly[`${i.toString().padStart(2, '0')}:00`] = Math.random() * 1000;
    }
    return hourly;
  }

  private generateDailyRevenue(): { [day: string]: number } {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daily: { [day: string]: number } = {};
    days.forEach(day => {
      daily[day] = Math.random() * 5000;
    });
    return daily;
  }

  private generateMonthlyRevenue(): { [month: string]: number } {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly: { [month: string]: number } = {};
    months.forEach(month => {
      monthly[month] = Math.random() * 50000;
    });
    return monthly;
  }

  private calculateRevenueGrowth(venueId: string): number {
    // Mock calculation - would use historical data
    return 8 + Math.random() * 12;
  }

  // Venue Optimization
  public async generateVenueOptimization(venueId: string): Promise<VenueOptimization> {
    const performance = this.venuePerformances.get(venueId);
    if (!performance) {
      throw new Error('Venue performance not found');
    }

    const optimization: VenueOptimization = {
      venueId,
      recommendations: this.generateOptimizationRecommendations(performance),
      implementationPlan: this.generateImplementationPlan(),
      expectedImpact: {
        revenueIncrease: this.calculateExpectedRevenueIncrease(performance),
        efficiencyGain: this.calculateExpectedEfficiencyGain(performance),
        customerSatisfaction: this.calculateExpectedSatisfactionIncrease(performance)
      },
      priority: this.determinePriority(performance)
    };

    this.venueOptimizations.set(venueId, [optimization]);
    this.emit('optimizationGenerated', optimization);

    return optimization;
  }

  private generateOptimizationRecommendations(performance: VenuePerformance): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    if (performance.tableUtilization > 80) {
      recommendations.push({
        id: this.generateId(),
        category: 'layout',
        title: 'Expand Table Capacity',
        description: 'Add additional tables to meet high demand',
        impact: { revenue: 15, efficiency: 10, satisfaction: 5 },
        cost: 25000,
        implementationTime: 30,
        difficulty: 'medium'
      });
    }

    if (performance.playerEngagement < 70) {
      recommendations.push({
        id: this.generateId(),
        category: 'marketing',
        title: 'Implement Loyalty Program',
        description: 'Create customer loyalty program to increase engagement',
        impact: { revenue: 10, efficiency: 5, satisfaction: 15 },
        cost: 5000,
        implementationTime: 14,
        difficulty: 'easy'
      });
    }

    return recommendations;
  }

  private generateImplementationPlan(): ImplementationStep[] {
    return [
      {
        id: this.generateId(),
        recommendationId: 'rec-1',
        step: 'Assess current capacity and demand',
        duration: 7,
        cost: 1000,
        dependencies: [],
        status: 'pending'
      },
      {
        id: this.generateId(),
        recommendationId: 'rec-1',
        step: 'Design expansion layout',
        duration: 14,
        cost: 5000,
        dependencies: ['step-1'],
        status: 'pending'
      }
    ];
  }

  private calculateExpectedRevenueIncrease(performance: VenuePerformance): number {
    return performance.revenue * 0.15; // 15% increase
  }

  private calculateExpectedEfficiencyGain(performance: VenuePerformance): number {
    return 10 + Math.random() * 10; // 10-20% efficiency gain
  }

  private calculateExpectedSatisfactionIncrease(performance: VenuePerformance): number {
    return 5 + Math.random() * 10; // 5-15% satisfaction increase
  }

  private determinePriority(performance: VenuePerformance): VenueOptimization['priority'] {
    if (performance.tableUtilization > 90) return 'critical';
    if (performance.playerEngagement < 60) return 'high';
    if (performance.averageRating < 3.5) return 'high';
    return 'medium';
  }

  // Utility Methods
  public getVenuePerformance(venueId: string): VenuePerformance | undefined {
    return this.venuePerformances.get(venueId);
  }

  public getAllVenuePerformances(): VenuePerformance[] {
    return Array.from(this.venuePerformances.values());
  }

  public getTopPerformingVenues(limit: number = 10): VenuePerformance[] {
    return Array.from(this.venuePerformances.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  public getVenueAnalytics(venueId: string): VenueAnalytics[] {
    return this.venueAnalytics.get(venueId) || [];
  }

  public getTablePerformances(venueId: string): TablePerformance[] {
    return this.tablePerformances.get(venueId) || [];
  }

  public getPlayerEngagements(venueId: string): PlayerEngagement[] {
    return this.playerEngagements.get(venueId) || [];
  }

  public getRevenueAnalytics(venueId: string): RevenueAnalytics[] {
    return this.revenueAnalytics.get(venueId) || [];
  }

  public getVenueOptimizations(venueId: string): VenueOptimization[] {
    return this.venueOptimizations.get(venueId) || [];
  }

  private updateMetrics(): void {
    const venues = Array.from(this.venuePerformances.values());
    
    this.metrics.totalVenues = venues.length;
    this.metrics.activeVenues = venues.filter(v => 
      v.lastUpdated > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    this.metrics.averageRevenue = venues.reduce((sum, v) => sum + v.revenue, 0) / venues.length;
    this.metrics.averageUtilization = venues.reduce((sum, v) => sum + v.tableUtilization, 0) / venues.length;
    this.metrics.totalRevenue = venues.reduce((sum, v) => sum + v.revenue, 0);
    this.metrics.topPerformers = this.getTopPerformingVenues(5).map(v => v.venueId);
    this.metrics.averageRating = venues.reduce((sum, v) => sum + v.averageRating, 0) / venues.length;
    this.metrics.lastActivity = new Date();
  }

  public getConfig(): VenueConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<VenueConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  public getMetrics(): VenueMetrics {
    return { ...this.metrics };
  }

  private generateId(): string {
    return `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AdvancedVenueManagementService; 
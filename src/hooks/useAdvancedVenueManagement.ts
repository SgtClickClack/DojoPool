import { useState, useEffect, useCallback } from 'react';

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

export const useAdvancedVenueManagement = () => {
  const [config, setConfig] = useState<VenueConfig | null>(null);
  const [metrics, setMetrics] = useState<VenueMetrics | null>(null);
  const [performances, setPerformances] = useState<VenuePerformance[]>([]);
  const [topVenues, setTopVenues] = useState<VenuePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration Management
  const getConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/advanced-venue-management/config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      } else {
        setError(data.error || 'Failed to get configuration');
      }
    } catch (err) {
      setError('Failed to get configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<VenueConfig>) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/advanced-venue-management/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig })
      });
      const data = await response.json();
      
      if (data.success) {
        await getConfig(); // Refresh config
      } else {
        setError(data.error || 'Failed to update configuration');
      }
    } catch (err) {
      setError('Failed to update configuration');
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  // Metrics Management
  const getMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/advanced-venue-management/metrics');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      } else {
        setError(data.error || 'Failed to get metrics');
      }
    } catch (err) {
      setError('Failed to get metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Venue Performance Management
  const getAllPerformances = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/advanced-venue-management/performances');
      const data = await response.json();
      
      if (data.success) {
        setPerformances(data.performances);
      } else {
        setError(data.error || 'Failed to get performances');
      }
    } catch (err) {
      setError('Failed to get performances');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getVenuePerformance = useCallback(async (venueId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/performances/${venueId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.performance;
      } else {
        setError(data.error || 'Failed to get venue performance');
        return null;
      }
    } catch (err) {
      setError('Failed to get venue performance');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateVenuePerformance = useCallback(async (venueId: string, performanceData: any) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/performances/${venueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performanceData })
      });
      const data = await response.json();
      
      if (data.success) {
        await getAllPerformances(); // Refresh performances
        return data.performance;
      } else {
        setError(data.error || 'Failed to update venue performance');
        return null;
      }
    } catch (err) {
      setError('Failed to update venue performance');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAllPerformances]);

  const getTopPerformingVenues = useCallback(async (limit: number = 10) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/performances/top/${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setTopVenues(data.topVenues);
        return data.topVenues;
      } else {
        setError(data.error || 'Failed to get top performing venues');
        return [];
      }
    } catch (err) {
      setError('Failed to get top performing venues');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Venue Analytics
  const generateVenueAnalytics = useCallback(async (
    venueId: string,
    period: VenueAnalytics['period'],
    startDate: Date,
    endDate: Date
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/analytics/${venueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, startDate, endDate })
      });
      const data = await response.json();
      
      if (data.success) {
        return data.analytics;
      } else {
        setError(data.error || 'Failed to generate venue analytics');
        return null;
      }
    } catch (err) {
      setError('Failed to generate venue analytics');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getVenueAnalytics = useCallback(async (venueId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/analytics/${venueId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.analytics;
      } else {
        setError(data.error || 'Failed to get venue analytics');
        return [];
      }
    } catch (err) {
      setError('Failed to get venue analytics');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Table Performance
  const updateTablePerformance = useCallback(async (
    tableId: string,
    venueId: string,
    performanceData: any
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/tables/${tableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, performanceData })
      });
      const data = await response.json();
      
      if (data.success) {
        return data.performance;
      } else {
        setError(data.error || 'Failed to update table performance');
        return null;
      }
    } catch (err) {
      setError('Failed to update table performance');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTablePerformances = useCallback(async (venueId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/tables/${venueId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.tables;
      } else {
        setError(data.error || 'Failed to get table performances');
        return [];
      }
    } catch (err) {
      setError('Failed to get table performances');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMaintenanceRecord = useCallback(async (
    tableId: string,
    venueId: string,
    maintenanceData: Omit<MaintenanceRecord, 'id' | 'date'>
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/tables/${tableId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, maintenanceData })
      });
      const data = await response.json();
      
      if (data.success) {
        return data.record;
      } else {
        setError(data.error || 'Failed to add maintenance record');
        return null;
      }
    } catch (err) {
      setError('Failed to add maintenance record');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Player Engagement
  const updatePlayerEngagement = useCallback(async (
    venueId: string,
    playerId: string,
    engagementData: any
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/engagement/${venueId}/${playerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engagementData })
      });
      const data = await response.json();
      
      if (data.success) {
        return data.engagement;
      } else {
        setError(data.error || 'Failed to update player engagement');
        return null;
      }
    } catch (err) {
      setError('Failed to update player engagement');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPlayerEngagements = useCallback(async (venueId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/engagement/${venueId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.engagements;
      } else {
        setError(data.error || 'Failed to get player engagements');
        return [];
      }
    } catch (err) {
      setError('Failed to get player engagements');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Revenue Analytics
  const generateRevenueAnalytics = useCallback(async (venueId: string, period: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/revenue/${venueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period })
      });
      const data = await response.json();
      
      if (data.success) {
        return data.analytics;
      } else {
        setError(data.error || 'Failed to generate revenue analytics');
        return null;
      }
    } catch (err) {
      setError('Failed to generate revenue analytics');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRevenueAnalytics = useCallback(async (venueId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/revenue/${venueId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.analytics;
      } else {
        setError(data.error || 'Failed to get revenue analytics');
        return [];
      }
    } catch (err) {
      setError('Failed to get revenue analytics');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Venue Optimization
  const generateVenueOptimization = useCallback(async (venueId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/optimization/${venueId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        return data.optimization;
      } else {
        setError(data.error || 'Failed to generate venue optimization');
        return null;
      }
    } catch (err) {
      setError('Failed to generate venue optimization');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getVenueOptimizations = useCallback(async (venueId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-venue-management/optimization/${venueId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.optimizations;
      } else {
        setError(data.error || 'Failed to get venue optimizations');
        return [];
      }
    } catch (err) {
      setError('Failed to get venue optimizations');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    getConfig();
    getMetrics();
    getAllPerformances();
    getTopPerformingVenues();
  }, [getConfig, getMetrics, getAllPerformances, getTopPerformingVenues]);

  return {
    // State
    config,
    metrics,
    performances,
    topVenues,
    isLoading,
    error,
    
    // Configuration
    getConfig,
    updateConfig,
    
    // Metrics
    getMetrics,
    
    // Venue Performance
    getAllPerformances,
    getVenuePerformance,
    updateVenuePerformance,
    getTopPerformingVenues,
    
    // Venue Analytics
    generateVenueAnalytics,
    getVenueAnalytics,
    
    // Table Performance
    updateTablePerformance,
    getTablePerformances,
    addMaintenanceRecord,
    
    // Player Engagement
    updatePlayerEngagement,
    getPlayerEngagements,
    
    // Revenue Analytics
    generateRevenueAnalytics,
    getRevenueAnalytics,
    
    // Venue Optimization
    generateVenueOptimization,
    getVenueOptimizations,
    
    // Utility
    clearError: () => setError(null)
  };
}; 
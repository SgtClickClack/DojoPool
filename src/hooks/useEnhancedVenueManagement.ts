import { useState, useEffect, useCallback } from 'react';
import { 
  Venue, 
  VenueAnalytics, 
  VenueStatus, 
  TournamentSchedule, 
  RevenueOptimization, 
  VenuePerformance 
} from '../services/venue/EnhancedVenueManagementService';
import { enhancedVenueManagementService } from '../services/venue/EnhancedVenueManagementService';

export const useEnhancedVenueManagement = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [analytics, setAnalytics] = useState<VenueAnalytics | null>(null);
  const [status, setStatus] = useState<VenueStatus | null>(null);
  const [schedules, setSchedules] = useState<TournamentSchedule[]>([]);
  const [optimization, setOptimization] = useState<RevenueOptimization | null>(null);
  const [performance, setPerformance] = useState<VenuePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Load venues
  const loadVenues = useCallback(async () => {
    try {
      setLoading(true);
      const venuesData = await enhancedVenueManagementService.getVenues();
      setVenues(venuesData);
      if (venuesData.length > 0 && !selectedVenue) {
        setSelectedVenue(venuesData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  }, [selectedVenue]);

  // Load venue analytics
  const loadAnalytics = useCallback(async (venueId: string) => {
    try {
      setAnalyticsLoading(true);
      const analyticsData = await enhancedVenueManagementService.getVenueAnalytics(venueId);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Load venue status
  const loadStatus = useCallback(async (venueId: string) => {
    try {
      setStatusLoading(true);
      const statusData = await enhancedVenueManagementService.getVenueStatus(venueId);
      setStatus(statusData);
    } catch (err) {
      console.error('Failed to load status:', err);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  // Load tournament schedules
  const loadSchedules = useCallback(async (venueId: string) => {
    try {
      const schedulesData = await enhancedVenueManagementService.getTournamentSchedules(venueId);
      setSchedules(schedulesData);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  }, []);

  // Load optimization data
  const loadOptimization = useCallback(async (venueId: string) => {
    try {
      setOptimizationLoading(true);
      const optimizationData = await enhancedVenueManagementService.getRevenueOptimization(venueId);
      setOptimization(optimizationData);
    } catch (err) {
      console.error('Failed to load optimization:', err);
    } finally {
      setOptimizationLoading(false);
    }
  }, []);

  // Load performance data
  const loadPerformance = useCallback(async (venueId: string) => {
    try {
      setPerformanceLoading(true);
      const performanceData = await enhancedVenueManagementService.getVenuePerformance(venueId);
      setPerformance(performanceData);
    } catch (err) {
      console.error('Failed to load performance:', err);
    } finally {
      setPerformanceLoading(false);
    }
  }, []);

  // Select venue
  const selectVenue = useCallback(async (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    if (venue) {
      setSelectedVenue(venue);
      await Promise.all([
        loadAnalytics(venueId),
        loadStatus(venueId),
        loadSchedules(venueId),
        loadOptimization(venueId),
        loadPerformance(venueId)
      ]);
    }
  }, [venues, loadAnalytics, loadStatus, loadSchedules, loadOptimization, loadPerformance]);

  // Update venue
  const updateVenue = useCallback(async (venueId: string, updates: Partial<Venue>) => {
    try {
      const updatedVenue = await enhancedVenueManagementService.updateVenue(venueId, updates);
      if (updatedVenue) {
        setVenues(prev => prev.map(v => v.id === venueId ? updatedVenue : v));
        if (selectedVenue?.id === venueId) {
          setSelectedVenue(updatedVenue);
        }
      }
      return updatedVenue;
    } catch (err) {
      console.error('Failed to update venue:', err);
      return null;
    }
  }, [selectedVenue]);

  // Update tournament schedule
  const updateTournamentSchedule = useCallback(async (scheduleId: string, updates: Partial<TournamentSchedule>) => {
    try {
      const updatedSchedule = await enhancedVenueManagementService.updateTournamentSchedule(scheduleId, updates);
      if (updatedSchedule) {
        setSchedules(prev => prev.map(s => s.id === scheduleId ? updatedSchedule : s));
      }
      return updatedSchedule;
    } catch (err) {
      console.error('Failed to update schedule:', err);
      return null;
    }
  }, []);

  // Create tournament
  const createTournament = useCallback(async (venueId: string, scheduleId: string) => {
    try {
      const result = await enhancedVenueManagementService.createTournament(venueId, scheduleId);
      if (result.success) {
        // Refresh schedules to show updated lastCreated
        await loadSchedules(venueId);
      }
      return result;
    } catch (err) {
      console.error('Failed to create tournament:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [loadSchedules]);

  // Resolve alert
  const resolveAlert = useCallback(async (venueId: string, alertId: string) => {
    try {
      const success = await enhancedVenueManagementService.resolveAlert(venueId, alertId);
      if (success) {
        await loadStatus(venueId);
      }
      return success;
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      return false;
    }
  }, [loadStatus]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (selectedVenue) {
      await Promise.all([
        loadAnalytics(selectedVenue.id),
        loadStatus(selectedVenue.id),
        loadSchedules(selectedVenue.id),
        loadOptimization(selectedVenue.id),
        loadPerformance(selectedVenue.id)
      ]);
    }
  }, [selectedVenue, loadAnalytics, loadStatus, loadSchedules, loadOptimization, loadPerformance]);

  // Initial load
  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  // Load venue data when venue is selected
  useEffect(() => {
    if (selectedVenue) {
      Promise.all([
        loadAnalytics(selectedVenue.id),
        loadStatus(selectedVenue.id),
        loadSchedules(selectedVenue.id),
        loadOptimization(selectedVenue.id),
        loadPerformance(selectedVenue.id)
      ]);
    }
  }, [selectedVenue, loadAnalytics, loadStatus, loadSchedules, loadOptimization, loadPerformance]);

  return {
    venues,
    selectedVenue,
    analytics,
    status,
    schedules,
    optimization,
    performance,
    loading,
    error,
    analyticsLoading,
    statusLoading,
    optimizationLoading,
    performanceLoading,
    selectVenue,
    updateVenue,
    updateTournamentSchedule,
    createTournament,
    resolveAlert,
    refreshData
  };
}; 
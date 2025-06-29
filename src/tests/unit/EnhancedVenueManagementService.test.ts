import { enhancedVenueManagementService } from '../../services/venue/EnhancedVenueManagementService';

describe('EnhancedVenueManagementService', () => {
  let service: typeof enhancedVenueManagementService;

  beforeEach(() => {
    service = enhancedVenueManagementService;
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(service).toBeDefined();
    });
  });

  describe('venue analytics', () => {
    it('should get venue analytics', async () => {
      const analytics = await service.getVenueAnalytics('venue-1', 'daily');
      
      expect(analytics).toBeDefined();
      expect(analytics?.venueId).toBe('venue-1');
      expect(analytics?.metrics.totalVisitors).toBeGreaterThanOrEqual(0);
      expect(analytics?.metrics.revenue).toBeGreaterThanOrEqual(0);
      expect(analytics?.metrics.matchesPlayed).toBeGreaterThanOrEqual(0);
    });

    it('should get venue status', async () => {
      const status = await service.getVenueStatus('venue-1');
      
      expect(status).toBeDefined();
      expect(status?.venueId).toBe('venue-1');
      expect(status?.status).toBeDefined();
      expect(status?.activeTables).toBeGreaterThanOrEqual(0);
      expect(status?.currentVisitors).toBeGreaterThanOrEqual(0);
    });

    it('should get venue performance', async () => {
      const performance = await service.getVenuePerformance('venue-1', 'daily');
      
      expect(performance).toBeDefined();
      expect(performance?.venueId).toBe('venue-1');
      expect(performance?.kpis.visitorSatisfaction).toBeGreaterThanOrEqual(0);
      expect(performance?.kpis.tableUtilization).toBeGreaterThanOrEqual(0);
    });
  });

  describe('venue management', () => {
    it('should get venues', async () => {
      const venues = await service.getVenues();
      expect(Array.isArray(venues)).toBe(true);
      expect(venues.length).toBeGreaterThan(0);
    });

    it('should get venue by ID', async () => {
      const venue = await service.getVenue('venue-1');
      expect(venue).toBeDefined();
      expect(venue?.id).toBe('venue-1');
      expect(venue?.name).toBeDefined();
    });

    it('should update venue', async () => {
      const result = await service.updateVenue('venue-1', {
        name: 'Updated Venue Name'
      });
      
      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Venue Name');
    });
  });

  describe('tournament scheduling', () => {
    it('should get tournament schedules', async () => {
      const schedules = await service.getTournamentSchedules('venue-1');
      expect(Array.isArray(schedules)).toBe(true);
    });

    it('should update tournament schedule', async () => {
      const schedules = await service.getTournamentSchedules('venue-1');
      if (schedules.length > 0) {
        const result = await service.updateTournamentSchedule(schedules[0].id, {
          name: 'Updated Schedule'
        });
        
        expect(result).toBeDefined();
        expect(result?.name).toBe('Updated Schedule');
      }
    });

    it('should create tournament', async () => {
      const schedules = await service.getTournamentSchedules('venue-1');
      if (schedules.length > 0) {
        const result = await service.createTournament('venue-1', schedules[0].id);
        
        expect(result.success).toBe(true);
        expect(result.tournamentId).toBeDefined();
      }
    });
  });

  describe('revenue optimization', () => {
    it('should get revenue optimization', async () => {
      const optimization = await service.getRevenueOptimization('venue-1', 'daily');
      
      expect(optimization).toBeDefined();
      expect(optimization?.venueId).toBe('venue-1');
      expect(optimization?.recommendations).toBeDefined();
      expect(optimization?.pricingAnalysis).toBeDefined();
    });
  });

  describe('system health', () => {
    it('should get venue health', async () => {
      const health = await service.getVenueHealth('venue-1');
      
      expect(health).toBeDefined();
      expect(typeof health.overall).toBe('boolean');
      expect(health.details).toBeDefined();
    });

    it('should resolve alerts', async () => {
      const status = await service.getVenueStatus('venue-1');
      if (status && status.alerts.length > 0) {
        const result = await service.resolveAlert('venue-1', status.alerts[0].id);
        expect(typeof result).toBe('boolean');
      }
    });
  });
});
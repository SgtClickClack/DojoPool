export interface ScheduleEvent {
  id: string;
  type: 'tournament' | 'match' | 'event';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'ongoing' | 'completed';
  participants?: number;
  maxParticipants?: number;
  venue?: string;
  venueId?: string;
  tournamentId?: string;
  matchId?: string;
}

export interface ScheduleFilters {
  venueId?: string;
  eventType?: 'tournament' | 'match' | 'event';
  status?: 'upcoming' | 'ongoing' | 'completed';
  startDate?: Date;
  endDate?: Date;
}

class ScheduleService {
  private static instance: ScheduleService;
  private eventListeners: Map<string, Set<(events: ScheduleEvent[]) => void>> =
    new Map();
  private scheduleCache: Map<string, ScheduleEvent[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.initializeRealTimeUpdates();
  }

  public static getInstance(): ScheduleService {
    if (!ScheduleService.instance) {
      ScheduleService.instance = new ScheduleService();
    }
    return ScheduleService.instance;
  }

  /**
   * Get schedule events for a specific venue
   */
  async getVenueSchedule(
    venueId: string,
    filters?: ScheduleFilters
  ): Promise<ScheduleEvent[]> {
    const cacheKey = `venue_${venueId}_${JSON.stringify(filters || {})}`;

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.scheduleCache.get(cacheKey) || [];
    }

    try {
      // Fetch from backend API
      const events = await this.fetchVenueScheduleFromAPI(venueId, filters);

      // Cache the results
      this.scheduleCache.set(cacheKey, events);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return events;
    } catch (error) {
      console.error('Error fetching venue schedule:', error);
      // Return cached data if available, even if expired
      return this.scheduleCache.get(cacheKey) || [];
    }
  }

  /**
   * Get upcoming tournaments for a venue
   */
  async getUpcomingTournaments(venueId: string): Promise<ScheduleEvent[]> {
    const filters: ScheduleFilters = {
      venueId,
      eventType: 'tournament',
      status: 'upcoming',
    };

    const events = await this.getVenueSchedule(venueId, filters);
    return events.filter((event) => event.type === 'tournament');
  }

  /**
   * Get ongoing matches for a venue
   */
  async getOngoingMatches(venueId: string): Promise<ScheduleEvent[]> {
    const filters: ScheduleFilters = {
      venueId,
      eventType: 'match',
      status: 'ongoing',
    };

    const events = await this.getVenueSchedule(venueId, filters);
    return events.filter((event) => event.type === 'match');
  }

  /**
   * Get completed events for a venue
   */
  async getCompletedEvents(venueId: string): Promise<ScheduleEvent[]> {
    const filters: ScheduleFilters = {
      venueId,
      status: 'completed',
    };

    const events = await this.getVenueSchedule(venueId, filters);
    return events;
  }

  /**
   * Subscribe to real-time schedule updates for a venue
   */
  subscribeToVenueSchedule(
    venueId: string,
    callback: (events: ScheduleEvent[]) => void
  ): () => void {
    if (!this.eventListeners.has(venueId)) {
      this.eventListeners.set(venueId, new Set());
    }

    this.eventListeners.get(venueId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(venueId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(venueId);
        }
      }
    };
  }

  /**
   * Create a new schedule event
   */
  async createScheduleEvent(
    event: Omit<ScheduleEvent, 'id'>
  ): Promise<ScheduleEvent> {
    try {
      // This would call the backend API
      const newEvent: ScheduleEvent = {
        ...event,
        id: this.generateEventId(),
      };

      // Add to cache and notify listeners
      this.addEventToCache(newEvent);
      this.notifyListeners(newEvent.venueId || '', [newEvent]);

      return newEvent;
    } catch (error) {
      console.error('Error creating schedule event:', error);
      throw error;
    }
  }

  /**
   * Update an existing schedule event
   */
  async updateScheduleEvent(
    eventId: string,
    updates: Partial<ScheduleEvent>
  ): Promise<ScheduleEvent> {
    try {
      // This would call the backend API
      const updatedEvent = await this.fetchEventFromAPI(eventId);
      const mergedEvent = { ...updatedEvent, ...updates };

      // Update cache and notify listeners
      this.updateEventInCache(mergedEvent);
      this.notifyListeners(mergedEvent.venueId || '', [mergedEvent]);

      return mergedEvent;
    } catch (error) {
      console.error('Error updating schedule event:', error);
      throw error;
    }
  }

  /**
   * Delete a schedule event
   */
  async deleteScheduleEvent(eventId: string): Promise<void> {
    try {
      // This would call the backend API
      const event = await this.fetchEventFromAPI(eventId);

      // Remove from cache and notify listeners
      this.removeEventFromCache(eventId);
      this.notifyListeners(event.venueId || '', []);
    } catch (error) {
      console.error('Error deleting schedule event:', error);
      throw error;
    }
  }

  /**
   * Register for a tournament
   */
  async registerForTournament(
    tournamentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // This would call the backend API to register the user
      const success = await this.registerUserForTournamentAPI(
        tournamentId,
        userId
      );

      if (success) {
        // Refresh cache and notify listeners
        this.invalidateCache(`tournament_${tournamentId}`);
        this.notifyListeners('', []); // Notify all listeners to refresh
      }

      return success;
    } catch (error) {
      console.error('Error registering for tournament:', error);
      throw error;
    }
  }

  // Private methods

  private async fetchVenueScheduleFromAPI(
    venueId: string,
    filters?: ScheduleFilters
  ): Promise<ScheduleEvent[]> {
    // This would make an actual API call to the backend
    // For now, return sample data
    return this.generateSampleScheduleData(venueId);
  }

  private async fetchEventFromAPI(eventId: string): Promise<ScheduleEvent> {
    // This would make an actual API call to the backend
    throw new Error('API integration not yet implemented');
  }

  private async registerUserForTournamentAPI(
    tournamentId: string,
    userId: string
  ): Promise<boolean> {
    // This would make an actual API call to the backend
    return true; // Simulate success
  }

  private generateSampleScheduleData(venueId: string): ScheduleEvent[] {
    const now = new Date();
    const venueName = `Dojo ${venueId.slice(-4)}`;

    return [
      {
        id: '1',
        type: 'tournament',
        title: 'Weekly Championship',
        description: 'Weekly pool tournament with cash prizes',
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
        status: 'upcoming',
        participants: 12,
        maxParticipants: 16,
        venue: venueName,
        venueId,
        tournamentId: 'tournament_1',
      },
      {
        id: '2',
        type: 'match',
        title: 'Pro Challenge Match',
        description: 'Exhibition match between top players',
        startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'upcoming',
        venue: venueName,
        venueId,
        matchId: 'match_1',
      },
      {
        id: '3',
        type: 'event',
        title: 'Pool Clinic',
        description: 'Beginner-friendly pool instruction',
        startTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
        endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
        status: 'upcoming',
        participants: 8,
        maxParticipants: 12,
        venue: venueName,
        venueId,
      },
      {
        id: '4',
        type: 'tournament',
        title: 'Daily Quick Play',
        description: 'Fast-paced single elimination tournament',
        startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        endTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
        status: 'ongoing',
        participants: 8,
        maxParticipants: 8,
        venue: venueName,
        venueId,
        tournamentId: 'tournament_2',
      },
      {
        id: '5',
        type: 'match',
        title: 'Morning League',
        description: 'Regular league match',
        startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        status: 'completed',
        venue: venueName,
        venueId,
        matchId: 'match_2',
      },
    ];
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  private addEventToCache(event: ScheduleEvent): void {
    // Add to all relevant cache keys
    const venueKey = `venue_${event.venueId}_${JSON.stringify({})}`;
    const events = this.scheduleCache.get(venueKey) || [];
    events.push(event);
    this.scheduleCache.set(venueKey, events);
  }

  private updateEventInCache(event: ScheduleEvent): void {
    // Update in all relevant cache keys
    const venueKey = `venue_${event.venueId}_${JSON.stringify({})}`;
    const events = this.scheduleCache.get(venueKey) || [];
    const index = events.findIndex((e) => e.id === event.id);
    if (index !== -1) {
      events[index] = event;
      this.scheduleCache.set(venueKey, events);
    }
  }

  private removeEventFromCache(eventId: string): void {
    // Remove from all cache keys
    for (const [key, events] of this.scheduleCache.entries()) {
      const filteredEvents = events.filter((e) => e.id !== eventId);
      this.scheduleCache.set(key, filteredEvents);
    }
  }

  private invalidateCache(cacheKey: string): void {
    this.scheduleCache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
  }

  private notifyListeners(venueId: string, events: ScheduleEvent[]): void {
    const listeners = this.eventListeners.get(venueId);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(events);
        } catch (error) {
          console.error('Error in schedule listener callback:', error);
        }
      });
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeRealTimeUpdates(): void {
    // Set up WebSocket connection or polling for real-time updates
    // This would connect to the backend's real-time service
    setInterval(() => {
      // Poll for updates every 30 seconds
      this.pollForUpdates();
    }, 30000);
  }

  private async pollForUpdates(): Promise<void> {
    // This would check for updates from the backend
    // For now, just refresh cache expiry
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.scheduleCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }
}

export default ScheduleService;

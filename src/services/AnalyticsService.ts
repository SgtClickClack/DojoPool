import { useState, useEffect, useCallback } from 'react';

interface GameAnalytics {
  totalGames: number;
  totalShots: number;
  averageAccuracy: number;
  winRate: number;
  averageGameDuration: number;
  mostUsedShots: {
    type: string;
    count: number;
    successRate: number;
  }[];
  recentGames: {
    id: string;
    date: string;
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    score: {
      player: number;
      opponent: number;
    };
    accuracy: number;
    duration: number;
  }[];
  progression: {
    date: string;
    accuracy: number;
    winRate: number;
  }[];
  shotDistribution: {
    type: string;
    percentage: number;
  }[];
}

interface PlayerStats {
  totalPlayTime: number;
  rank: number;
  rating: number;
  achievements: {
    id: string;
    name: string;
    description: string;
    dateUnlocked: string;
  }[];
  skillLevels: {
    category: string;
    level: number;
    progress: number;
  }[];
}

interface AnalyticsData {
  gameAnalytics: GameAnalytics;
  playerStats: PlayerStats;
  lastUpdated: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private data: AnalyticsData;
  private observers: ((data: AnalyticsData) => void)[];
  private updateInterval: NodeJS.Timeout | null;

  private constructor() {
    this.data = {
      gameAnalytics: {
        totalGames: 0,
        totalShots: 0,
        averageAccuracy: 0,
        winRate: 0,
        averageGameDuration: 0,
        mostUsedShots: [],
        recentGames: [],
        progression: [],
        shotDistribution: [],
      },
      playerStats: {
        totalPlayTime: 0,
        rank: 0,
        rating: 0,
        achievements: [],
        skillLevels: [],
      },
      lastUpdated: new Date().toISOString(),
    };
    this.observers = [];
    this.updateInterval = null;
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public startTracking(): void {
    if (this.updateInterval) return;

    // Update analytics every 5 minutes
    this.updateInterval = setInterval(() => {
      this.updateAnalytics();
    }, 5 * 60 * 1000);

    // Initial update
    this.updateAnalytics();
  }

  public stopTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public subscribe(callback: (data: AnalyticsData) => void): () => void {
    this.observers.push(callback);
    callback(this.data);
    return () => {
      this.observers = this.observers.filter(observer => observer !== callback);
    };
  }

  public getAnalytics(): AnalyticsData {
    return { ...this.data };
  }

  public async trackGameEvent(event: {
    type: 'shot' | 'game_end' | 'achievement';
    data: any;
  }): Promise<void> {
    switch (event.type) {
      case 'shot':
        await this.trackShot(event.data);
        break;
      case 'game_end':
        await this.trackGameEnd(event.data);
        break;
      case 'achievement':
        await this.trackAchievement(event.data);
        break;
    }
    this.notifyObservers();
  }

  private async updateAnalytics(): Promise<void> {
    try {
      // Simulate API call to fetch analytics data
      const response = await this.fetchAnalyticsData();
      this.data = {
        ...this.data,
        ...response,
        lastUpdated: new Date().toISOString(),
      };
      this.notifyObservers();
    } catch (error) {
      console.error('Failed to update analytics:', error);
    }
  }

  private async fetchAnalyticsData(): Promise<Partial<AnalyticsData>> {
    // TODO: Replace with actual API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          gameAnalytics: {
            ...this.data.gameAnalytics,
            // Update with new data
          },
          playerStats: {
            ...this.data.playerStats,
            // Update with new data
          },
        });
      }, 1000);
    });
  }

  private async trackShot(data: {
    type: string;
    success: boolean;
    position: { x: number; y: number };
  }): Promise<void> {
    // Update shot-related analytics
    this.data.gameAnalytics.totalShots++;
    
    // Update shot distribution
    const shotTypeIndex = this.data.gameAnalytics.shotDistribution.findIndex(
      s => s.type === data.type
    );
    if (shotTypeIndex >= 0) {
      this.data.gameAnalytics.shotDistribution[shotTypeIndex].percentage =
        (this.data.gameAnalytics.shotDistribution[shotTypeIndex].percentage *
          (this.data.gameAnalytics.totalShots - 1) +
          (data.success ? 100 : 0)) /
        this.data.gameAnalytics.totalShots;
    } else {
      this.data.gameAnalytics.shotDistribution.push({
        type: data.type,
        percentage: data.success ? 100 : 0,
      });
    }

    // Update most used shots
    const mostUsedShotIndex = this.data.gameAnalytics.mostUsedShots.findIndex(
      s => s.type === data.type
    );
    if (mostUsedShotIndex >= 0) {
      const shot = this.data.gameAnalytics.mostUsedShots[mostUsedShotIndex];
      shot.count++;
      shot.successRate =
        (shot.successRate * (shot.count - 1) + (data.success ? 100 : 0)) / shot.count;
    } else {
      this.data.gameAnalytics.mostUsedShots.push({
        type: data.type,
        count: 1,
        successRate: data.success ? 100 : 0,
      });
    }

    // Sort most used shots by count
    this.data.gameAnalytics.mostUsedShots.sort((a, b) => b.count - a.count);
  }

  private async trackGameEnd(data: {
    result: 'win' | 'loss' | 'draw';
    score: { player: number; opponent: number };
    accuracy: number;
    duration: number;
    opponent: string;
  }): Promise<void> {
    // Update game-related analytics
    this.data.gameAnalytics.totalGames++;
    this.data.gameAnalytics.averageGameDuration =
      (this.data.gameAnalytics.averageGameDuration *
        (this.data.gameAnalytics.totalGames - 1) +
        data.duration) /
      this.data.gameAnalytics.totalGames;

    // Update win rate
    const wins = this.data.gameAnalytics.recentGames.filter(
      g => g.result === 'win'
    ).length;
    this.data.gameAnalytics.winRate = (wins / this.data.gameAnalytics.totalGames) * 100;

    // Add to recent games
    this.data.gameAnalytics.recentGames.unshift({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      opponent: data.opponent,
      result: data.result,
      score: data.score,
      accuracy: data.accuracy,
      duration: data.duration,
    });

    // Keep only last 10 games
    if (this.data.gameAnalytics.recentGames.length > 10) {
      this.data.gameAnalytics.recentGames.pop();
    }

    // Update progression
    this.data.gameAnalytics.progression.push({
      date: new Date().toISOString(),
      accuracy: data.accuracy,
      winRate: this.data.gameAnalytics.winRate,
    });

    // Keep only last 30 days of progression
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.data.gameAnalytics.progression = this.data.gameAnalytics.progression.filter(
      p => new Date(p.date) >= thirtyDaysAgo
    );
  }

  private async trackAchievement(data: {
    id: string;
    name: string;
    description: string;
  }): Promise<void> {
    // Add achievement if not already unlocked
    if (!this.data.playerStats.achievements.some(a => a.id === data.id)) {
      this.data.playerStats.achievements.push({
        ...data,
        dateUnlocked: new Date().toISOString(),
      });
    }
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.getAnalytics()));
  }
}

const useAnalytics = (callback?: (data: AnalyticsData) => void) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const analytics = AnalyticsService.getInstance();

  useEffect(() => {
    analytics.startTracking();

    const unsubscribe = analytics.subscribe(newData => {
      setData(newData);
      callback?.(newData);
    });

    return () => {
      unsubscribe();
      analytics.stopTracking();
    };
  }, [callback]);

  const trackEvent = useCallback(
    (event: { type: 'shot' | 'game_end' | 'achievement'; data: any }) => {
      return analytics.trackGameEvent(event);
    },
    []
  );

  return {
    data,
    trackEvent,
  };
};

export type { GameAnalytics, PlayerStats, AnalyticsData };
export { useAnalytics };
export default AnalyticsService; 
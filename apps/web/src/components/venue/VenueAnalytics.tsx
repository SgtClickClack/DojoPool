'use client';

import React, { useState } from 'react';
import { withErrorBoundary } from '@/components/ErrorBoundary/withErrorBoundary';
import AnalyticsHeader from './VenueAnalytics/AnalyticsHeader';
import AnalyticsMetrics from './VenueAnalytics/AnalyticsMetrics';
import RevenueBreakdown from './VenueAnalytics/RevenueBreakdown';
import PlayerActivity from './VenueAnalytics/PlayerActivity';
import AnalyticsInsights from './VenueAnalytics/AnalyticsInsights';
import HourlyActivityChart from './VenueAnalytics/HourlyActivityChart';

interface AnalyticsData {
  period: 'today' | 'week' | 'month' | 'year';
  revenue: {
    total: number;
    change: number;
    breakdown: {
      tournamentEntryFees: number;
      tableRentals: number;
      merchandise: number;
      other: number;
    };
  };
  players: {
    total: number;
    change: number;
    activeToday: number;
    newThisPeriod: number;
  };
  tournaments: {
    total: number;
    completed: number;
    averageParticipants: number;
    totalPrizePool: number;
  };
  tables: {
    total: number;
    utilization: number;
    peakHours: string[];
  };
  ratings: {
    average: number;
    totalReviews: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  topGames: {
    gameType: string;
    plays: number;
    revenue: number;
  }[];
  hourlyActivity: {
    hour: number;
    players: number;
    revenue: number;
  }[];
}

interface VenueAnalyticsProps {
  analyticsData?: AnalyticsData;
}

const VenueAnalytics: React.FC<VenueAnalyticsProps> = ({ analyticsData }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    'today' | 'week' | 'month' | 'year'
  >('week');

  // Mock analytics data
  const mockData: AnalyticsData = {
    period: selectedPeriod,
    revenue: {
      total: 15750,
      change: 12.5,
      breakdown: {
        tournamentEntryFees: 8500,
        tableRentals: 5200,
        merchandise: 1800,
        other: 250,
      },
    },
    players: {
      total: 1247,
      change: 8.3,
      activeToday: 89,
      newThisPeriod: 156,
    },
    tournaments: {
      total: 28,
      completed: 24,
      averageParticipants: 14.2,
      totalPrizePool: 18500,
    },
    tables: {
      total: 12,
      utilization: 78,
      peakHours: ['7-9 PM', '2-4 PM'],
    },
    ratings: {
      average: 4.6,
      totalReviews: 89,
      distribution: {
        5: 45,
        4: 28,
        3: 12,
        2: 3,
        1: 1,
      },
    },
    topGames: [
      { gameType: '8-Ball', plays: 1456, revenue: 7250 },
      { gameType: '9-Ball', plays: 892, revenue: 4450 },
      { gameType: 'Straight Pool', plays: 567, revenue: 2830 },
    ],
    hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      players: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 500) + 100,
    })),
  };

  const data = analyticsData || mockData;

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      <AnalyticsMetrics data={data} />

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueBreakdown data={data} />
        <PlayerActivity data={data} />
      </div>

      <AnalyticsInsights data={data} />

      <HourlyActivityChart data={data} />
    </div>
  );
};

export default withErrorBoundary(VenueAnalytics, {
  componentName: 'VenueAnalytics',
  showRetry: true,
  showHome: true,
  showReport: true,
});
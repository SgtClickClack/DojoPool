import { motion } from 'framer-motion';
import React from 'react';

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

interface HourlyActivityChartProps {
  data: AnalyticsData;
}

const HourlyActivityChart: React.FC<HourlyActivityChartProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Hourly Activity
      </h3>
      <div className="grid grid-cols-24 gap-1 h-32">
        {data.hourlyActivity.map((hour) => (
          <div
            key={hour.hour}
            className="bg-blue-200 rounded-sm hover:bg-blue-300 transition-colors cursor-pointer chart-bar"
            style={{
              height: `${(hour.players / 60) * 100}%`,
              marginTop: 'auto',
            }}
            title={`${hour.hour}:00 - ${hour.players} players, ${formatCurrency(hour.revenue)} revenue`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>12 AM</span>
      </div>
    </motion.div>
  );
};

export default HourlyActivityChart;

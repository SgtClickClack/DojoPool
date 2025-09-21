import { ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';
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

interface PlayerActivityProps {
  data: AnalyticsData;
}

const PlayerActivity: React.FC<PlayerActivityProps> = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Player Activity
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm text-blue-600 font-medium">
              Active Today
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {data.players.activeToday}
            </p>
          </div>
          <UsersIcon className="w-8 h-8 text-blue-500" />
        </div>

        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm text-green-600 font-medium">
              New This Period
            </p>
            <p className="text-2xl font-bold text-green-900">
              {data.players.newThisPeriod}
            </p>
          </div>
          <ChartBarIcon className="w-8 h-8 text-green-500" />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Table Utilization</p>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${data.tables.utilization}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {data.tables.utilization}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerActivity;

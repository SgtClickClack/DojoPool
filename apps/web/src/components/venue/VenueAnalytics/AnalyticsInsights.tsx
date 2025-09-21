import { ClockIcon, StarIcon } from '@heroicons/react/24/outline';
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

interface AnalyticsInsightsProps {
  data: AnalyticsData;
}

const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Games */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Games
        </h3>
        <div className="space-y-3">
          {data.topGames.map((game, index) => (
            <div
              key={game.gameType}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{game.gameType}</p>
                  <p className="text-sm text-gray-600">{game.plays} plays</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(game.revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Ratings Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Customer Ratings
        </h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 w-12">
                <span className="text-sm text-gray-600">{rating}</span>
                <StarIcon className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="progress-bar progress-bar-yellow"
                  style={{
                    width: `${(data.ratings.distribution[rating as keyof typeof data.ratings.distribution] / data.ratings.totalReviews) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">
                {
                  data.ratings.distribution[
                    rating as keyof typeof data.ratings.distribution
                  ]
                }
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Peak Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Peak Hours
        </h3>
        <div className="space-y-3">
          {data.tables.peakHours.map((hour, index) => (
            <div key={hour} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Peak Time {index + 1}
                </p>
                <p className="text-sm text-gray-600">{hour}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 mb-1">
            Tournament Recommendation
          </p>
          <p className="text-sm text-blue-800">
            Schedule tournaments during peak hours for maximum participation.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsInsights;

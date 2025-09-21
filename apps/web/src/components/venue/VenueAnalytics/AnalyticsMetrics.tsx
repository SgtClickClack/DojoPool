import {
  ArrowDownIcon,
  ArrowUpIcon,
  CurrencyDollarIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
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

interface AnalyticsMetricsProps {
  data: AnalyticsData;
}

const AnalyticsMetrics: React.FC<AnalyticsMetricsProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? ArrowUpIcon : ArrowDownIcon;
  };

  const metrics = [
    {
      label: 'Total Revenue',
      value: formatCurrency(data.revenue.total),
      change: data.revenue.change,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Active Players',
      value: formatNumber(data.players.total),
      change: data.players.change,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Tournaments',
      value: formatNumber(data.tournaments.total),
      change: null,
      icon: TrophyIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Average Rating',
      value: data.ratings.average.toFixed(1),
      change: null,
      icon: StarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const ChangeIcon =
          metric.change !== null ? getChangeIcon(metric.change) : null;

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metric.value}
                </p>
                {metric.change !== null && (
                  <div
                    className={`flex items-center space-x-1 mt-1 ${getChangeColor(metric.change)}`}
                  >
                    {ChangeIcon && <ChangeIcon className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                )}
              </div>
              <div
                className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}
              >
                <Icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AnalyticsMetrics;

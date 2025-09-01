'use client';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  TrendingUpIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

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
  const [selectedMetric, setSelectedMetric] = useState<
    'revenue' | 'players' | 'tournaments'
  >('revenue');

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

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600">
            Track your venue's performance and insights
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
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
        ].map((metric, index) => {
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
                      <ChangeIcon className="w-4 h-4" />
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

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Breakdown
          </h3>
          <div className="space-y-4">
            {[
              {
                label: 'Tournament Entry Fees',
                amount: data.revenue.breakdown.tournamentEntryFees,
                percentage:
                  (data.revenue.breakdown.tournamentEntryFees /
                    data.revenue.total) *
                  100,
                color: 'bg-blue-500',
              },
              {
                label: 'Table Rentals',
                amount: data.revenue.breakdown.tableRentals,
                percentage:
                  (data.revenue.breakdown.tableRentals / data.revenue.total) *
                  100,
                color: 'bg-green-500',
              },
              {
                label: 'Merchandise',
                amount: data.revenue.breakdown.merchandise,
                percentage:
                  (data.revenue.breakdown.merchandise / data.revenue.total) *
                  100,
                color: 'bg-yellow-500',
              },
              {
                label: 'Other',
                amount: data.revenue.breakdown.other,
                percentage:
                  (data.revenue.breakdown.other / data.revenue.total) * 100,
                color: 'bg-gray-500',
              },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Player Activity */}
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
              <TrendingUpIcon className="w-8 h-8 text-green-500" />
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
      </div>

      {/* Additional Insights */}
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
                    className="bg-yellow-400 h-2 rounded-full"
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

      {/* Hourly Activity Chart (Simplified) */}
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
              className="bg-blue-200 rounded-sm hover:bg-blue-300 transition-colors cursor-pointer"
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
    </div>
  );
};

export default VenueAnalytics;

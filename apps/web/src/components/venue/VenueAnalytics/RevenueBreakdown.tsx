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

interface RevenueBreakdownProps {
  data: AnalyticsData;
}

const RevenueBreakdown: React.FC<RevenueBreakdownProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const breakdownItems = [
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
  ];

  return (
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
        {breakdownItems.map((item) => (
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
                className={`progress-bar ${item.color} transition-all duration-300`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RevenueBreakdown;

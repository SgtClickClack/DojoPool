import ProtectedRoute from '@/components/Common/ProtectedRoute';
import VenuePortalLayout from '@/components/VenuePortal/VenuePortalLayout';

// Venue Portal Home Page
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CogIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TagIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

const VenuePortalHome: React.FC = () => {
  const quickActions = [
    {
      id: 'profile',
      label: 'Edit Profile',
      description: 'Update venue information, hours, and amenities',
      icon: PencilIcon,
      color: 'bg-blue-500',
      href: '/venue/portal/profile',
    },
    {
      id: 'specials',
      label: 'Manage Specials',
      description: 'Create and manage special offers and promotions',
      icon: TagIcon,
      color: 'bg-green-500',
      href: '/venue/portal/specials',
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      description: 'Create and manage tournaments and events',
      icon: TrophyIcon,
      color: 'bg-purple-500',
      href: '/venue/portal/tournaments',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'View venue performance and player statistics',
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      href: '/venue/portal/analytics',
    },
  ];

  const stats = [
    {
      label: 'Monthly Revenue',
      value: '$18,500',
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Active Players',
      value: '45',
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Average Rating',
      value: '4.6',
      icon: StarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Total Tournaments',
      value: '28',
      icon: TrophyIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <ProtectedRoute>
      <VenuePortalLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Venue Portal</h1>
            <p className="text-gray-600 mt-2">
              Manage your venue profile, specials, tournaments, and analytics
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {action.label}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tournaments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Tournaments
                </h3>
                <Link
                  href="/venue/portal/tournaments"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'Friday Night Showdown',
                    status: 'upcoming',
                    participants: 24,
                    prizePool: 1200,
                  },
                  {
                    name: 'Championship Series',
                    status: 'active',
                    participants: 32,
                    prizePool: 2500,
                  },
                  {
                    name: 'Beginner Bash',
                    status: 'completed',
                    participants: 16,
                    prizePool: 600,
                  },
                ].map((tournament, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {tournament.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {tournament.participants} players • $
                        {tournament.prizePool}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tournament.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : tournament.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tournament.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Players */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Players
                </h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Leaderboard
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Alex Chen', gamesWon: 45, winRate: 78, earnings: 1200 },
                  { name: 'Sarah Kim', gamesWon: 38, winRate: 82, earnings: 980 },
                  { name: 'Mike Johnson', gamesWon: 52, winRate: 71, earnings: 1450 },
                ].map((player, index) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {player.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {player.gamesWon} wins • {player.winRate}% rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${player.earnings}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </VenuePortalLayout>
    </ProtectedRoute>
  );
};

export default VenuePortalHome;

'use client';

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
import { AnimatePresence, motion, HTMLMotionProps } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically load heavy components
const TournamentManagement = dynamic(() => import('./TournamentManagement'), {
  loading: () => <div>Loading Tournament Management...</div>,
});
const VenueAnalytics = dynamic(() => import('./VenueAnalytics'), {
  loading: () => <div>Loading Analytics...</div>,
});
const VenueSettings = dynamic(() => import('./VenueSettings'), {
  loading: () => <div>Loading Settings...</div>,
});

interface Venue {
  id: string;
  name: string;
  address: string;
  description: string;
  images: string[];
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  operatingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  amenities: string[];
  stats: {
    totalTables: number;
    activePlayers: number;
    monthlyRevenue: number;
    averageRating: number;
    totalTournaments: number;
  };
}

interface VenueManagementPortalProps {
  venue?: Venue;
  isOwner?: boolean;
}

const VenueManagementPortal: React.FC<VenueManagementPortalProps> = ({
  venue,
  isOwner = true,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'tournaments' | 'analytics' | 'settings'
  >('dashboard');
  const [showCreateTournament, setShowCreateTournament] = useState(false);

  // Mock venue data
  const mockVenue: Venue = {
    id: '1',
    name: 'Jade Tiger Pool Hall',
    address: '123 Collins Street, Melbourne VIC 3000',
    description:
      "Melbourne's premier pool venue featuring 12 professional tables, craft beer, and competitive tournaments.",
    images: ['/venue-main.jpg', '/venue-interior.jpg', '/venue-bar.jpg'],
    contactInfo: {
      phone: '+61 3 1234 5678',
      email: 'info@jadetiger.com.au',
      website: 'https://jadetiger.com.au',
    },
    operatingHours: {
      monday: { open: '16:00', close: '24:00' },
      tuesday: { open: '16:00', close: '24:00' },
      wednesday: { open: '16:00', close: '24:00' },
      thursday: { open: '16:00', close: '02:00' },
      friday: { open: '14:00', close: '04:00' },
      saturday: { open: '12:00', close: '04:00' },
      sunday: { open: '12:00', close: '24:00' },
    },
    amenities: [
      'Professional Tables',
      'Craft Beer',
      'Food Service',
      'WiFi',
      'Parking',
    ],
    stats: {
      totalTables: 12,
      activePlayers: 45,
      monthlyRevenue: 18500,
      averageRating: 4.6,
      totalTournaments: 28,
    },
  };

  const currentVenue = venue || mockVenue;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BuildingStorefrontIcon },
    { id: 'tournaments', label: 'Tournaments', icon: TrophyIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ];

  const quickActions = [
    {
      id: 'create-tournament',
      label: 'Create Tournament',
      icon: PlusIcon,
      color: 'bg-blue-500',
      action: () => setShowCreateTournament(true),
    },
    {
      id: 'manage-specials',
      label: 'Special Offers',
      icon: TagIcon,
      color: 'bg-green-500',
      action: () => router.push('/venue/specials'),
    },
    {
      id: 'promote',
      label: 'Promote Venue',
      icon: MegaphoneIcon,
      color: 'bg-purple-500',
      action: () => router.push('/venue/promote'),
    },
    {
      id: 'edit-profile',
      label: 'Edit Profile',
      icon: PencilIcon,
      color: 'bg-orange-500',
      action: () => router.push('/venue/edit'),
    },
  ];

  const recentTournaments = [
    {
      id: '1',
      name: 'Friday Night Showdown',
      status: 'upcoming',
      participants: 24,
      prizePool: 1200,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Championship Series',
      status: 'active',
      participants: 32,
      prizePool: 2500,
      startTime: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '3',
      name: 'Beginner Bash',
      status: 'completed',
      participants: 16,
      prizePool: 600,
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];

  const topPlayers = [
    { name: 'Alex Chen', gamesWon: 45, winRate: 78, earnings: 1200 },
    { name: 'Sarah Kim', gamesWon: 38, winRate: 82, earnings: 980 },
    { name: 'Mike Johnson', gamesWon: 52, winRate: 71, earnings: 1450 },
    { name: 'Emma Wilson', gamesWon: 29, winRate: 85, earnings: 760 },
    { name: 'David Lee', gamesWon: 41, winRate: 73, earnings: 1100 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <BuildingStorefrontIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentVenue.name}
                </h1>
                <p className="text-gray-600">{currentVenue.address}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Today&apos;s Revenue</p>
                <p className="text-lg font-bold text-green-600">$1,247</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Active Players</p>
                <p className="text-lg font-bold text-blue-600">
                  {currentVenue.stats.activePlayers}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className={`flex flex-col items-center justify-center p-4 ${action.color} text-white rounded-lg`}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium text-center">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <div key="dashboard" className="space-y-6">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      {
                        label: 'Monthly Revenue',
                        value: `$${currentVenue.stats.monthlyRevenue.toLocaleString()}`,
                        icon: CurrencyDollarIcon,
                        color: 'text-green-600',
                        bgColor: 'bg-green-50',
                      },
                      {
                        label: 'Active Players',
                        value: currentVenue.stats.activePlayers.toString(),
                        icon: UsersIcon,
                        color: 'text-blue-600',
                        bgColor: 'bg-blue-50',
                      },
                      {
                        label: 'Average Rating',
                        value: currentVenue.stats.averageRating.toString(),
                        icon: StarIcon,
                        color: 'text-yellow-600',
                        bgColor: 'bg-yellow-50',
                      },
                      {
                        label: 'Total Tournaments',
                        value: currentVenue.stats.totalTournaments.toString(),
                        icon: TrophyIcon,
                        color: 'text-purple-600',
                        bgColor: 'bg-purple-50',
                      },
                    ].map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <div
                          key={stat.label}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                {stat.label}
                              </p>
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

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Tournaments */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Recent Tournaments
                        </h3>
                        <button
                          onClick={() => setActiveTab('tournaments')}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {recentTournaments.map((tournament) => (
                          <div
                            key={tournament.id}
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
                        {topPlayers.map((player, index) => (
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
                                  {player.gamesWon} wins • {player.winRate}%
                                  rate
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
              )}

              {activeTab === 'tournaments' && (
                <TournamentManagement
                  tournaments={[]}
                  venueId={currentVenue.id}
                />
              )}

              {activeTab === 'analytics' && <VenueAnalytics />}

              {activeTab === 'settings' && (
                <VenueSettings venue={currentVenue} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueManagementPortal;

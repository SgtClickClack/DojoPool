'use client';

import {
  BellIcon,
  ChatBubbleLeftIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  FireIcon,
  MapIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

interface MobileDashboardProps {
  user?: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
    coins: number;
    rank: number;
  };
  stats?: {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    currentStreak: number;
    totalEarnings: number;
  };
  notifications?: number;
  messages?: number;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  user = {
    id: '1',
    name: 'Player',
    level: 5,
    coins: 1250,
    rank: 42,
  },
  stats = {
    gamesPlayed: 24,
    gamesWon: 18,
    winRate: 75,
    currentStreak: 3,
    totalEarnings: 2500,
  },
  notifications = 3,
  messages = 2,
}) => {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    {
      id: 'play',
      title: 'Quick Play',
      subtitle: 'Find a game now',
      icon: MapIcon,
      color: 'bg-green-500',
      action: () => router.push('/world'),
    },
    {
      id: 'tournament',
      title: 'Tournaments',
      subtitle: 'Join competitions',
      icon: TrophyIcon,
      color: 'bg-yellow-500',
      action: () => router.push('/tournaments'),
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      subtitle: 'Buy & sell items',
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
      action: () => router.push('/marketplace'),
    },
    {
      id: 'clan',
      title: 'My Clan',
      subtitle: 'Team up with others',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      action: () => router.push('/clan'),
    },
  ];

  const statCards = [
    {
      label: 'Games Played',
      value: stats.gamesPlayed.toString(),
      icon: ArrowTrendingUpIcon,
      color: 'text-blue-500',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate}%`,
      icon: StarIcon,
      color: 'text-green-500',
    },
    {
      label: 'Current Streak',
      value: stats.currentStreak.toString(),
      icon: FireIcon,
      color: 'text-orange-500',
    },
    {
      label: 'Total Earnings',
      value: `${stats.totalEarnings} DC`,
      icon: CurrencyDollarIcon,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="mobile-first min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mobile-game-header"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">
                Good {getGreeting(currentTime)}
              </h1>
              <p className="text-white text-opacity-80 text-sm">
                Level {user.level} • Rank #{user.rank}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/notifications')}
              className="relative w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
            >
              <BellIcon className="w-5 h-5 text-white" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </motion.button>

            {/* Messages */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/messages')}
              className="relative w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
            >
              <ChatBubbleLeftIcon className="w-5 h-5 text-white" />
              {messages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {messages > 9 ? '9+' : messages}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Coins Display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-4 -mt-4 mb-6"
      >
        <div className="mobile-card-primary p-4 rounded-xl text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <CurrencyDollarIcon className="w-5 h-5" />
            <span className="text-2xl font-bold">
              {user.coins.toLocaleString()}
            </span>
          </div>
          <p className="text-white text-opacity-80 text-sm">Dojo Coins</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-gray-900 font-bold text-lg mb-4 px-4">
          Quick Actions
        </h2>
        <div className="mobile-grid px-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className="mobile-card-secondary text-left"
              >
                <div
                  className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm">{action.subtitle}</p>
                <div className="flex items-center justify-end mt-3">
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Stats Overview */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <h2 className="text-gray-900 font-bold text-lg mb-4 px-4">
          Your Stats
        </h2>
        <div className="mobile-grid px-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="mobile-card-secondary"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                  <span className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Recent Activity */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mb-20" // Space for navigation
      >
        <h2 className="text-gray-900 font-bold text-lg mb-4 px-4">
          Recent Activity
        </h2>
        <div className="px-4 space-y-3">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mobile-card-secondary p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">Won Tournament</p>
                <p className="text-gray-600 text-sm">2 hours ago • +150 DC</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mobile-card-secondary p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MapIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">Captured Dojo</p>
                <p className="text-gray-600 text-sm">
                  5 hours ago • Jade Tiger
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="mobile-card-secondary p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">Clan Victory</p>
                <p className="text-gray-600 text-sm">1 day ago • +50 DC</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

// Helper function to get greeting based on time
function getGreeting(time: Date): string {
  const hour = time.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default MobileDashboard;

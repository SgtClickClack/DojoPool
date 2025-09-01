'use client';

import {
  BellIcon,
  CalendarIcon,
  CameraIcon,
  ChevronRightIcon,
  CogIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PencilIcon,
  ShieldCheckIcon,
  StarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  level: number;
  experience: number;
  experienceToNext: number;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    currentStreak: number;
    totalEarnings: number;
    favoriteVenue: string;
    memberSince: Date;
  };
  achievements: {
    total: number;
    recent: string[];
  };
  clan?: {
    name: string;
    role: string;
    members: number;
  };
}

interface MobileProfileProps {
  profile?: UserProfile;
  isOwnProfile?: boolean;
}

const MobileProfile: React.FC<MobileProfileProps> = ({
  profile,
  isOwnProfile = true,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'stats' | 'achievements'
  >('overview');

  // Mock profile data
  const mockProfile: UserProfile = {
    id: '1',
    name: 'Alex Chen',
    username: 'alex_pool_master',
    email: 'alex@example.com',
    avatar: '🎱',
    level: 15,
    experience: 8750,
    experienceToNext: 1250,
    stats: {
      gamesPlayed: 127,
      gamesWon: 89,
      winRate: 70,
      currentStreak: 5,
      totalEarnings: 2840,
      favoriteVenue: 'Jade Tiger',
      memberSince: new Date('2023-01-15'),
    },
    achievements: {
      total: 23,
      recent: ['First Win', 'Streak Master', 'High Roller'],
    },
    clan: {
      name: 'Pool Legends',
      role: 'Captain',
      members: 12,
    },
  };

  const userProfile = profile || mockProfile;

  const statCards = [
    {
      label: 'Games Played',
      value: userProfile.stats.gamesPlayed.toString(),
      icon: TrophyIcon,
      color: 'text-blue-500',
    },
    {
      label: 'Win Rate',
      value: `${userProfile.stats.winRate}%`,
      icon: StarIcon,
      color: 'text-green-500',
    },
    {
      label: 'Current Streak',
      value: userProfile.stats.currentStreak.toString(),
      icon: TrophyIcon,
      color: 'text-orange-500',
    },
    {
      label: 'Total Earnings',
      value: `${userProfile.stats.totalEarnings} DC`,
      icon: CurrencyDollarIcon,
      color: 'text-yellow-500',
    },
  ];

  const menuItems = [
    {
      id: 'edit',
      label: 'Edit Profile',
      icon: PencilIcon,
      action: () => router.push('/profile/edit'),
    },
    {
      id: 'avatar',
      label: 'Change Avatar',
      icon: CameraIcon,
      action: () => router.push('/profile/avatar'),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      action: () => router.push('/settings/notifications'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: CogIcon,
      action: () => router.push('/settings'),
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const experienceProgress =
    (userProfile.experience /
      (userProfile.experience + userProfile.experienceToNext)) *
    100;

  return (
    <div className="mobile-first min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mobile-profile-header"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mobile-profile-avatar text-6xl mb-4"
          >
            {userProfile.avatar || '👤'}
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-white mb-1">
              {userProfile.name}
            </h1>
            <p className="text-white text-opacity-80 mb-4">
              @{userProfile.username}
            </p>

            {/* Level and Experience */}
            <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">
                  Level {userProfile.level}
                </span>
                <span className="text-white text-sm">
                  {userProfile.experience}/
                  {userProfile.experience + userProfile.experienceToNext} XP
                </span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${experienceProgress}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="bg-white h-2 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 pb-20">
        {/* Tab Navigation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg p-1 mb-6 flex"
        >
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'stats', label: 'Stats' },
            { id: 'achievements', label: 'Achievements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              {/* Clan Info */}
              {userProfile.clan && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mobile-card-secondary"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {userProfile.clan.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {userProfile.clan.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {userProfile.clan.members} members
                      </p>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 ml-auto" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Stats */}
              <div className="mobile-profile-stats">
                {statCards.slice(0, 4).map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="mobile-card-secondary text-center"
                    >
                      <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Favorite Venue */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mobile-card-secondary"
              >
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Favorite Venue</p>
                    <p className="text-sm text-gray-600">
                      {userProfile.stats.favoriteVenue}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Member Since */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mobile-card-secondary"
              >
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(userProfile.stats.memberSince)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              {/* Detailed Stats */}
              <div className="grid grid-cols-2 gap-4">
                {statCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="mobile-card-secondary text-center"
                    >
                      <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Performance Chart Placeholder */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mobile-card-secondary"
              >
                <h3 className="font-semibold text-gray-900 mb-4">
                  Performance Trend
                </h3>
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">
                    Performance chart would go here
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              {/* Achievement Summary */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mobile-card-secondary text-center"
              >
                <TrophyIcon className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">
                  {userProfile.achievements.total}
                </div>
                <div className="text-gray-600">Total Achievements</div>
              </motion.div>

              {/* Recent Achievements */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Recent Achievements
                </h3>
                <div className="space-y-3">
                  {userProfile.achievements.recent.map((achievement, index) => (
                    <motion.div
                      key={achievement}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="mobile-card-secondary"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <TrophyIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {achievement}
                          </p>
                          <p className="text-sm text-gray-600">
                            Unlocked recently
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Items (only for own profile) */}
        {isOwnProfile && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 space-y-3"
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  className="mobile-card-secondary w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MobileProfile;

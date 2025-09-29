'use client';

import {
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

interface Tournament {
  id: string;
  name: string;
  type: 'single-elimination' | 'round-robin' | 'swiss';
  status: 'upcoming' | 'active' | 'completed';
  startTime: Date;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  venue: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
}

interface MobileTournamentFlowProps {
  tournaments?: Tournament[];
}

const MobileTournamentFlow: React.FC<MobileTournamentFlowProps> = ({
  tournaments = [],
}) => {
  const _router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'upcoming' | 'active' | 'completed'
  >('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  // Mock data if none provided
  const mockTournaments: Tournament[] = [
    {
      id: '1',
      name: 'Friday Night Showdown',
      type: 'single-elimination',
      status: 'upcoming',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      entryFee: 50,
      prizePool: 1000,
      maxParticipants: 16,
      currentParticipants: 12,
      venue: 'Jade Tiger',
      difficulty: 'intermediate',
      description: 'Weekly tournament for intermediate players',
    },
    {
      id: '2',
      name: 'Championship Series',
      type: 'single-elimination',
      status: 'active',
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      entryFee: 100,
      prizePool: 2500,
      maxParticipants: 32,
      currentParticipants: 32,
      venue: 'Pool Palace',
      difficulty: 'advanced',
      description: 'Monthly championship for top players',
    },
    {
      id: '3',
      name: 'Beginner Bash',
      type: 'round-robin',
      status: 'upcoming',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      entryFee: 25,
      prizePool: 500,
      maxParticipants: 20,
      currentParticipants: 8,
      venue: 'Corner Pocket',
      difficulty: 'beginner',
      description: 'Friendly tournament for new players',
    },
  ];

  const displayTournaments =
    tournaments && tournaments.length > 0 ? tournaments : mockTournaments;

  const shouldShowExplicitEmptyState = tournaments && tournaments.length === 0;

  const filteredTournaments = (shouldShowExplicitEmptyState ? [] : displayTournaments).filter(
    (tournament) => {
      const matchesSearch =
        tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.venue.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        selectedFilter === 'all' || tournament.status === selectedFilter;

      return matchesSearch && matchesFilter;
    }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600';
      case 'intermediate':
        return 'text-yellow-600';
      case 'advanced':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
    const minutes = Math.abs(
      Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    );

    if (diff > 0) {
      if (hours > 24) {
        return date.toLocaleDateString();
      }
      if (hours > 0) {
        return `In ${hours}h ${minutes}m`;
      }
      return `In ${minutes}m`;
    } else {
      if (hours > 0) {
        return `${hours}h ${minutes}m ago`;
      }
      return `${minutes}m ago`;
    }
  };

  return (
    <div className="mobile-first min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200"
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Tournaments</h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 bg-gray-100 rounded-lg"
            >
              <FunnelIcon className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-form-input pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-3">
                <div className="flex space-x-2 overflow-x-auto">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'upcoming', label: 'Upcoming' },
                    { key: 'active', label: 'Active' },
                    { key: 'completed', label: 'Completed' },
                  ].map((filter) => (
                    <motion.button
                      key={filter.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedFilter(filter.key as any)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                        selectedFilter === filter.key
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {filter.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Tournament List */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mobile-tournament-list"
      >
        <AnimatePresence>
          {filteredTournaments.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ delay: index * 0.1 }}
              className="mobile-tournament-card"
              onClick={() => setSelectedTournament(tournament)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {tournament.name}
                  </h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {tournament.venue}
                    </span>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}
                >
                  {tournament.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <UsersIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {tournament.currentParticipants}/
                    {tournament.maxParticipants}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {tournament.entryFee} DC
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <StarIcon
                    className={`w-4 h-4 ${getDifficultyColor(tournament.difficulty)}`}
                  />
                  <span className="text-sm text-gray-600 capitalize">
                    {tournament.difficulty}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatTime(tournament.startTime)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-green-600">
                      {tournament.prizePool} DC
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      Prize Pool
                    </span>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        { (shouldShowExplicitEmptyState || filteredTournaments.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-12"
          >
            <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tournaments found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </motion.main>

      {/* Tournament Detail Modal */}
      <AnimatePresence>
        {selectedTournament && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mobile-modal-overlay"
              onClick={() => setSelectedTournament(null)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="mobile-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mobile-modal-header">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedTournament.name}
                  </h2>
                  <button
                    onClick={() => setSelectedTournament(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="mobile-modal-body">
                  <div className="space-y-4">
                    {/* Status and Type */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTournament.status)}`}
                      >
                        {selectedTournament.status}
                      </div>
                      <span className="text-sm text-gray-600 capitalize">
                        {selectedTournament.type.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Venue and Time */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {selectedTournament.venue}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">
                          {formatTime(selectedTournament.startTime)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <UsersIcon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedTournament.currentParticipants}
                        </div>
                        <div className="text-sm text-blue-600">
                          Participants
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <CurrencyDollarIcon className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {selectedTournament.prizePool}
                        </div>
                        <div className="text-sm text-green-600">Prize Pool</div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">About</h3>
                      <p className="text-gray-600 text-sm">
                        {selectedTournament.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mobile-modal-footer">
                  <button
                    onClick={() => setSelectedTournament(null)}
                    className="flex-1 mobile-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 mobile-btn-primary"
                    disabled={selectedTournament.status === 'completed'}
                  >
                    {selectedTournament.status === 'active'
                      ? 'Join Now'
                      : 'Register'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileTournamentFlow;

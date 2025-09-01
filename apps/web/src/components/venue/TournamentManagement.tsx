'use client';

import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
  TrophyIcon,
  UsersIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

interface Tournament {
  id: string;
  name: string;
  type: 'single-elimination' | 'round-robin' | 'swiss';
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  description: string;
  rules: string[];
  prizes: {
    position: number;
    prize: string;
    amount?: number;
  }[];
  registeredPlayers: {
    id: string;
    name: string;
    avatar?: string;
    skillLevel: string;
    registeredAt: Date;
  }[];
}

interface TournamentManagementProps {
  tournaments?: Tournament[];
  venueId?: string;
}

const TournamentManagement: React.FC<TournamentManagementProps> = ({
  tournaments = [],
  venueId = '1',
}) => {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [filter, setFilter] = useState<
    'all' | 'upcoming' | 'active' | 'completed'
  >('all');

  // Mock tournament data
  const mockTournaments: Tournament[] = [
    {
      id: '1',
      name: 'Friday Night Showdown',
      type: 'single-elimination',
      status: 'upcoming',
      startDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      entryFee: 50,
      prizePool: 1000,
      maxParticipants: 16,
      currentParticipants: 12,
      description: 'Weekly tournament for intermediate to advanced players',
      rules: [
        'Standard 8-ball rules apply',
        'Call your shot',
        '3 foul limit',
        'Winner advances to next round',
      ],
      prizes: [
        { position: 1, prize: '1st Place Trophy + $600', amount: 600 },
        { position: 2, prize: '2nd Place Trophy + $300', amount: 300 },
        { position: 3, prize: '3rd Place Trophy + $100', amount: 100 },
      ],
      registeredPlayers: [
        {
          id: '1',
          name: 'Alex Chen',
          skillLevel: 'Advanced',
          registeredAt: new Date(),
        },
        {
          id: '2',
          name: 'Sarah Kim',
          skillLevel: 'Intermediate',
          registeredAt: new Date(),
        },
      ],
    },
    {
      id: '2',
      name: 'Championship Series',
      type: 'single-elimination',
      status: 'active',
      startDate: new Date(Date.now() - 30 * 60 * 1000),
      entryFee: 100,
      prizePool: 2500,
      maxParticipants: 32,
      currentParticipants: 32,
      description: 'Monthly championship tournament',
      rules: ['Professional rules', 'Rack your own', 'Alternate breaks'],
      prizes: [
        { position: 1, prize: 'Championship Trophy + $1500', amount: 1500 },
        { position: 2, prize: 'Silver Trophy + $750', amount: 750 },
        { position: 3, prize: 'Bronze Trophy + $250', amount: 250 },
      ],
      registeredPlayers: [],
    },
    {
      id: '3',
      name: 'Beginner Bash',
      type: 'round-robin',
      status: 'completed',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 20 * 60 * 60 * 1000),
      entryFee: 25,
      prizePool: 500,
      maxParticipants: 20,
      currentParticipants: 18,
      description: 'Friendly tournament for new players',
      rules: ['Basic rules', 'Instructor available', 'No pressure environment'],
      prizes: [
        { position: 1, prize: 'Winner Trophy + $200', amount: 200 },
        { position: 2, prize: 'Runner-up Trophy + $100', amount: 100 },
        { position: 3, prize: 'Participation Prize', amount: 50 },
      ],
      registeredPlayers: [],
    },
  ];

  const displayTournaments =
    tournaments.length > 0 ? tournaments : mockTournaments;
  const filteredTournaments = displayTournaments.filter(
    (tournament) => filter === 'all' || tournament.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return PlayIcon;
      case 'upcoming':
        return CalendarIcon;
      case 'completed':
        return CheckCircleIcon;
      case 'cancelled':
        return XCircleIcon;
      case 'draft':
        return PencilIcon;
      default:
        return ClockIcon;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Tournament Management
          </h2>
          <p className="text-gray-600">
            Create and manage tournaments at your venue
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 w-fit"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Tournaments' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament, index) => {
          const StatusIcon = getStatusIcon(tournament.status);

          return (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {tournament.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tournament.description}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(tournament.status)}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span className="capitalize">{tournament.status}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <TrophyIcon className="w-4 h-4" />
                    <span>{tournament.type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(tournament.startDate)}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                      <UsersIcon className="w-4 h-4" />
                      <span className="text-sm">Participants</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {tournament.currentParticipants}
                    </div>
                    <div className="text-xs text-gray-500">
                      of {tournament.maxParticipants}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      <span className="text-sm">Prize Pool</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${tournament.prizePool}
                    </div>
                    <div className="text-xs text-gray-500">
                      Entry: ${tournament.entryFee}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Registration Progress</span>
                    <span>
                      {Math.round(
                        (tournament.currentParticipants /
                          tournament.maxParticipants) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(tournament.currentParticipants / tournament.maxParticipants) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedTournament(tournament)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>View</span>
                  </button>

                  <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-1">
                    <PencilIcon className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  {tournament.status === 'draft' && (
                    <button className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTournaments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tournaments found
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all'
              ? "You haven't created any tournaments yet."
              : `No ${filter} tournaments found.`}
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Your First Tournament</span>
          </button>
        </motion.div>
      )}

      {/* Tournament Detail Modal */}
      <AnimatePresence>
        {selectedTournament && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedTournament(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedTournament.name}
                      </h2>
                      <p className="text-gray-600">
                        {selectedTournament.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedTournament(null)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <XCircleIcon className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tournament Details */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Tournament Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium capitalize">
                              {selectedTournament.type.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Start Date:</span>
                            <span className="font-medium">
                              {formatDate(selectedTournament.startDate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Entry Fee:</span>
                            <span className="font-medium">
                              ${selectedTournament.entryFee}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prize Pool:</span>
                            <span className="font-medium">
                              ${selectedTournament.prizePool}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Participants:</span>
                            <span className="font-medium">
                              {selectedTournament.currentParticipants}/
                              {selectedTournament.maxParticipants}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rules */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Rules
                        </h3>
                        <ul className="space-y-1">
                          {selectedTournament.rules.map((rule, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 flex items-start space-x-2"
                            >
                              <span className="text-gray-400 mt-1">•</span>
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Prizes */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Prize Distribution
                        </h3>
                        <div className="space-y-2">
                          {selectedTournament.prizes.map((prize) => (
                            <div
                              key={prize.position}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <TrophyIcon className="w-4 h-4 text-yellow-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {prize.position === 1
                                      ? '1st'
                                      : prize.position === 2
                                        ? '2nd'
                                        : prize.position === 3
                                          ? '3rd'
                                          : `${prize.position}th`}{' '}
                                    Place
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {prize.prize}
                                  </p>
                                </div>
                              </div>
                              {prize.amount && (
                                <div className="text-right">
                                  <p className="font-bold text-green-600">
                                    ${prize.amount}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Registered Players */}
                      {selectedTournament.registeredPlayers.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Registered Players
                          </h3>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedTournament.registeredPlayers.map(
                              (player) => (
                                <div
                                  key={player.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                                      {player.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {player.name}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {player.skillLevel}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {player.registeredAt.toLocaleDateString()}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Create Tournament
                    </h2>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <XCircleIcon className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tournament Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter tournament name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tournament Type
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option>Single Elimination</option>
                          <option>Round Robin</option>
                          <option>Swiss</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Entry Fee ($)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Participants
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="16"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe your tournament..."
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                      Create Tournament
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentManagement;

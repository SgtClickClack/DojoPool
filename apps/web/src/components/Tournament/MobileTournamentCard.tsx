'use client';

import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  EyeIcon,
  MapPinIcon,
  PlayIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { CurrencyDollarIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

interface Tournament {
  id: string;
  name: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: number;
  venueName: string;
  venueAddress: string;
  entryFee: number;
  gameType: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface MobileTournamentCardProps {
  tournament: Tournament;
  isRegistered?: boolean;
  onRegister: (tournamentId: string) => void;
  onViewDetails: (tournamentId: string) => void;
  onJoinGame: (tournamentId: string) => void;
  onSpectate: (tournamentId: string) => void;
}

const MobileTournamentCard: React.FC<MobileTournamentCardProps> = ({
  tournament,
  isRegistered = false,
  onRegister,
  onViewDetails,
  onJoinGame,
  onSpectate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400';
      case 'intermediate':
        return 'text-yellow-400';
      case 'advanced':
        return 'text-orange-400';
      case 'expert':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const progressPercentage =
    (tournament.currentParticipants / tournament.maxParticipants) * 100;

  return (
    <motion.div layout className="mobile-card" whileTap={{ scale: 0.98 }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-white font-bold text-lg leading-tight">
              {tournament.name}
            </h3>
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(tournament.status)}`}
            />
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <div className="flex items-center space-x-1">
              <TrophyIcon className="w-4 h-4" />
              <span>{tournament.gameType}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span
                className={`font-medium ${getDifficultyColor(tournament.difficulty)}`}
              >
                {tournament.difficulty}
              </span>
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-white" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-white" />
          )}
        </motion.button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <CurrencyDollarIcon className="w-4 h-4 text-green-400" />
            <span className="text-gray-300 text-sm">Prize Pool</span>
          </div>
          <p className="text-white font-bold text-lg">
            {formatCurrency(tournament.prizePool)}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <UsersIcon className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300 text-sm">Players</span>
          </div>
          <p className="text-white font-bold text-lg">
            {tournament.currentParticipants}/{tournament.maxParticipants}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-300 mb-1">
          <span>Registration Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Time and Location */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <ClockIcon className="w-4 h-4" />
          <span>
            {tournament.status === 'upcoming' ? 'Starts' : 'Ends'}:{' '}
            {formatDate(
              tournament.status === 'upcoming'
                ? tournament.startDate
                : tournament.endDate
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <MapPinIcon className="w-4 h-4" />
          <span className="truncate">{tournament.venueName}</span>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-700 pt-4 mt-4">
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                {tournament.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Entry Fee</p>
                  <p className="text-white font-bold">
                    {tournament.entryFee === 0
                      ? 'Free'
                      : formatCurrency(tournament.entryFee)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Game Type</p>
                  <p className="text-white font-bold">{tournament.gameType}</p>
                </div>
              </div>

              <div className="text-xs text-gray-400 mb-4">
                📍 {tournament.venueAddress}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {tournament.status === 'active' && isRegistered ? (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onJoinGame(tournament.id)}
              className="mobile-btn mobile-btn-primary mobile-btn-full"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Join Game
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onSpectate(tournament.id)}
              className="mobile-btn mobile-btn-secondary p-3"
            >
              <EyeIcon className="w-5 h-5" />
            </motion.button>
          </>
        ) : tournament.status === 'upcoming' ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onRegister(tournament.id)}
            disabled={isRegistered}
            className={`mobile-btn mobile-btn-full ${
              isRegistered ? 'mobile-btn-secondary' : 'mobile-btn-primary'
            }`}
          >
            {isRegistered ? 'Registered ✓' : 'Register Now'}
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onSpectate(tournament.id)}
            className="mobile-btn mobile-btn-secondary mobile-btn-full"
          >
            <EyeIcon className="w-5 h-5 mr-2" />
            View Results
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewDetails(tournament.id)}
          className="mobile-btn mobile-btn-secondary p-3"
        >
          <ChevronDownIcon className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            tournament.status === 'active'
              ? 'bg-green-600 text-white'
              : tournament.status === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-600 text-white'
          }`}
        >
          {tournament.status.toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
};

export default MobileTournamentCard;

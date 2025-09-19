'use client';

import {
  AdjustmentsHorizontalIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

interface Dojo {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  owner: {
    name: string;
    level: number;
    avatar?: string;
  };
  stats: {
    activePlayers: number;
    prizePool: number;
    difficulty: 'easy' | 'medium' | 'hard';
    rating: number;
  };
  status: 'available' | 'occupied' | 'maintenance';
  distance?: number; // in meters
}

interface MobileWorldMapProps {
  userLocation?: {
    lat: number;
    lng: number;
  };
  dojos?: Dojo[];
}

const MobileWorldMap: React.FC<MobileWorldMapProps> = ({
  userLocation = { lat: -37.8136, lng: 144.9631 }, // Melbourne CBD
  dojos = [],
}) => {
  const router = useRouter();
  const [selectedDojo, setSelectedDojo] = useState<Dojo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'available' | 'nearby'
  >('all');
  const [mapCenter, setMapCenter] = useState(userLocation);

  // Mock data if none provided
  const mockDojos: Dojo[] = [
    {
      id: '1',
      name: 'Jade Tiger',
      location: {
        lat: -37.8136,
        lng: 144.9631,
        address: '123 Collins Street, Melbourne',
      },
      owner: {
        name: 'Master Chen',
        level: 15,
        avatar: '🐯',
      },
      stats: {
        activePlayers: 8,
        prizePool: 250,
        difficulty: 'medium',
        rating: 4.5,
      },
      status: 'available',
      distance: 500,
    },
    {
      id: '2',
      name: 'Pool Palace',
      location: {
        lat: -37.815,
        lng: 144.965,
        address: '456 Swanston Street, Melbourne',
      },
      owner: {
        name: 'Queen of Cues',
        level: 18,
        avatar: '👑',
      },
      stats: {
        activePlayers: 12,
        prizePool: 500,
        difficulty: 'hard',
        rating: 4.8,
      },
      status: 'occupied',
      distance: 800,
    },
    {
      id: '3',
      name: 'Corner Pocket',
      location: {
        lat: -37.812,
        lng: 144.961,
        address: '789 Bourke Street, Melbourne',
      },
      owner: {
        name: 'Billy The Kid',
        level: 12,
        avatar: '🎱',
      },
      stats: {
        activePlayers: 4,
        prizePool: 150,
        difficulty: 'easy',
        rating: 4.2,
      },
      status: 'available',
      distance: 300,
    },
  ];

  const displayDojos = dojos.length > 0 ? dojos : mockDojos;

  const filteredDojos = displayDojos.filter((dojo) => {
    const matchesSearch =
      dojo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dojo.location.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'available' && dojo.status === 'available') ||
      (selectedFilter === 'nearby' && (dojo.distance || 0) < 1000);

    return matchesSearch && matchesFilter;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
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
            <h1 className="text-xl font-bold text-gray-900">World Map</h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 bg-gray-100 rounded-lg"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search dojos..."
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
                    { key: 'all', label: 'All Dojos' },
                    { key: 'available', label: 'Available' },
                    { key: 'nearby', label: 'Nearby' },
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

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative flex-1"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        {/* Simplified Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Dojo Markers */}
          {filteredDojos.map((dojo, index) => (
            <motion.button
              key={dojo.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedDojo(dojo)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${20 + ((index * 25) % 60)}%`,
                top: `${20 + ((index * 30) % 60)}%`,
              }}
            >
              <div className="relative">
                <div
                  className={`w-12 h-12 ${getStatusColor(dojo.status)} rounded-full flex items-center justify-center shadow-lg`}
                >
                  <MapPinIcon className="w-6 h-6 text-white" />
                </div>
                {/* Status indicator */}
                <div
                  className={`absolute -top-1 -right-1 w-4 h-4 ${getStatusColor(dojo.status)} rounded-full border-2 border-white`}
                />
              </div>
            </motion.button>
          ))}

          {/* User Location */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: '50%', top: '50%' }}
          >
            <div className="relative">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  You are here
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center"
            onClick={() => setMapCenter(userLocation)}
          >
            <MapPinIcon className="w-6 h-6 text-gray-600" />
          </motion.button>
        </div>
      </motion.div>

      {/* Dojo Detail Modal */}
      <AnimatePresence>
        {selectedDojo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mobile-modal-overlay"
              onClick={() => setSelectedDojo(null)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="mobile-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mobile-modal-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                      {selectedDojo.owner.avatar || '🏛️'}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedDojo.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Owned by {selectedDojo.owner.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDojo(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="mobile-modal-body">
                  <div className="space-y-4">
                    {/* Location */}
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPinIcon className="w-5 h-5" />
                      <span className="text-sm">
                        {selectedDojo.location.address}
                      </span>
                      {selectedDojo.distance && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {formatDistance(selectedDojo.distance)} away
                        </span>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <UsersIcon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedDojo.stats.activePlayers}
                        </div>
                        <div className="text-sm text-blue-600">
                          Active Players
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <CurrencyDollarIcon className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {selectedDojo.stats.prizePool}
                        </div>
                        <div className="text-sm text-green-600">Prize Pool</div>
                      </div>
                    </div>

                    {/* Rating and Difficulty */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <StarIcon className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium text-gray-900">
                          {selectedDojo.stats.rating}
                        </span>
                        <span className="text-sm text-gray-600">rating</span>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedDojo.stats.difficulty)}`}
                      >
                        {selectedDojo.stats.difficulty}
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg">
                            {selectedDojo.owner.avatar || '👤'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedDojo.owner.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Level {selectedDojo.owner.level}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-3 h-3 ${getStatusColor(selectedDojo.status)} rounded-full`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mobile-modal-footer">
                  <button
                    onClick={() => setSelectedDojo(null)}
                    className="flex-1 mobile-btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    className="flex-1 mobile-btn-primary"
                    disabled={selectedDojo.status === 'maintenance'}
                  >
                    {selectedDojo.status === 'available'
                      ? 'Challenge'
                      : 'View Details'}
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

export default MobileWorldMap;

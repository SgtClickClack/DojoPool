'use client';

import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface MobileMapControlsProps {
  onLocationRequest: () => void;
  onFilterToggle: () => void;
  onSearchToggle: () => void;
  isLocationEnabled: boolean;
  hasActiveFilters: boolean;
  playerCount: number;
}

const MobileMapControls: React.FC<MobileMapControlsProps> = ({
  onLocationRequest,
  onFilterToggle,
  onSearchToggle,
  isLocationEnabled,
  hasActiveFilters,
  playerCount,
}) => {
  const [showLocationTooltip, setShowLocationTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-hide expanded controls after 5 seconds of inactivity
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleLocationClick = () => {
    if (!isLocationEnabled) {
      setShowLocationTooltip(true);
      setTimeout(() => setShowLocationTooltip(false), 3000);
    } else {
      onLocationRequest();
    }
  };

  return (
    <>
      {/* Main Control Panel */}
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          className="bg-black bg-opacity-80 backdrop-blur-md rounded-full p-2"
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
            aria-label="Map controls"
          >
            <AdjustmentsHorizontalIcon className="w-6 h-6 text-white" />
          </button>
        </motion.div>
      </div>

      {/* Expanded Controls */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-20 right-4 z-40 bg-black bg-opacity-90 backdrop-blur-md rounded-xl p-4 min-w-48"
          >
            <div className="space-y-3">
              {/* Search Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onSearchToggle();
                  setIsExpanded(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-300" />
                <span className="text-white text-sm">Search Venues</span>
              </motion.button>

              {/* Location Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  handleLocationClick();
                  setIsExpanded(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <MapPinIcon
                  className={`w-5 h-5 ${
                    isLocationEnabled ? 'text-green-400' : 'text-gray-400'
                  }`}
                />
                <span className="text-white text-sm">
                  {isLocationEnabled ? 'Find Nearby' : 'Enable Location'}
                </span>
              </motion.button>

              {/* Filters Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onFilterToggle();
                  setIsExpanded(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="relative">
                  <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-300" />
                  {hasActiveFilters && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <span className="text-white text-sm">Filters</span>
              </motion.button>

              {/* Player Count */}
              <div className="flex items-center justify-between p-3 border-t border-gray-700">
                <span className="text-gray-300 text-sm">Players Online</span>
                <span className="text-green-400 font-medium">
                  {playerCount}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Permission Tooltip */}
      <AnimatePresence>
        {showLocationTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-4 right-4 z-50 bg-yellow-600 text-white p-4 rounded-lg shadow-lg"
          >
            <div className="flex items-start space-x-3">
              <MapPinIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Location access is needed to find nearby venues and players.
                </p>
                <p className="text-xs mt-1 opacity-90">
                  Please enable location permissions in your browser settings.
                </p>
              </div>
              <button
                onClick={() => setShowLocationTooltip(false)}
                className="flex-shrink-0"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Access Floating Action Button */}
      <motion.div
        className="fixed bottom-24 right-4 z-40"
        whileTap={{ scale: 0.95 }}
      >
        <button
          onClick={handleLocationClick}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
            isLocationEnabled
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
          aria-label="Quick location access"
        >
          <MapPinIcon className="w-6 h-6 text-white" />
        </button>
      </motion.div>

      {/* Touch Gesture Hints */}
      <div className="fixed bottom-4 left-4 right-4 z-30 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="bg-black bg-opacity-70 backdrop-blur-md rounded-lg p-3 text-center"
        >
          <p className="text-white text-xs">
            💡 Tap markers for details • Pinch to zoom • Swipe to navigate
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .fixed.bottom-24 {
            bottom: calc(5rem + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
};

export default MobileMapControls;

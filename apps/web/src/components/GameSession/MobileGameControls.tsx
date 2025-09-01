'use client';

import {
  ChatBubbleLeftIcon,
  CogIcon,
  HandRaisedIcon,
  PauseIcon,
  PlayIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface MobileGameControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentPlayer: string;
  gameState: 'waiting' | 'playing' | 'paused' | 'finished';
  playerCount: number;
  timeRemaining?: number;
  onPlayPause: () => void;
  onForfeit: () => void;
  onSettings: () => void;
  onChat: () => void;
  onSpectate: () => void;
}

const MobileGameControls: React.FC<MobileGameControlsProps> = ({
  isPlaying,
  isPaused,
  currentPlayer,
  gameState,
  playerCount,
  timeRemaining,
  onPlayPause,
  onForfeit,
  onSettings,
  onChat,
  onSpectate,
}) => {
  const [showControls, setShowControls] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastInteraction > 3000) {
        setShowControls(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lastInteraction]);

  const handleInteraction = () => {
    setLastInteraction(Date.now());
    setShowControls(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30"
      onTouchStart={handleInteraction}
      onClick={handleInteraction}
    >
      {/* Top Status Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-40 pointer-events-auto"
          >
            <div className="bg-black bg-opacity-80 backdrop-blur-md rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4 text-gray-300" />
                    <span className="text-white text-sm font-medium">
                      {playerCount} players
                    </span>
                  </div>

                  {timeRemaining && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white text-sm font-mono">
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-white text-sm font-medium">
                  {currentPlayer}
                </div>
              </div>

              {/* Game State Indicator */}
              <div className="mt-2 flex items-center justify-center">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    gameState === 'playing'
                      ? 'bg-green-600 text-white'
                      : gameState === 'paused'
                        ? 'bg-yellow-600 text-white'
                        : gameState === 'finished'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-white'
                  }`}
                >
                  {gameState === 'playing' && '🎯 Your Turn'}
                  {gameState === 'paused' && '⏸️ Game Paused'}
                  {gameState === 'finished' && '🏆 Game Finished'}
                  {gameState === 'waiting' && '⏳ Waiting...'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-40 pointer-events-auto"
          >
            <div className="bg-black bg-opacity-90 backdrop-blur-md rounded-xl p-4">
              <div className="grid grid-cols-5 gap-3">
                {/* Play/Pause Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onPlayPause}
                  className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                    isPlaying && !isPaused
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  aria-label={isPlaying && !isPaused ? 'Pause' : 'Play'}
                >
                  {isPlaying && !isPaused ? (
                    <PauseIcon className="w-6 h-6 text-white" />
                  ) : (
                    <PlayIcon className="w-6 h-6 text-white" />
                  )}
                </motion.button>

                {/* Settings Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onSettings}
                  className="aspect-square rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all"
                  aria-label="Game settings"
                >
                  <CogIcon className="w-6 h-6 text-white" />
                </motion.button>

                {/* Chat Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onChat}
                  className="aspect-square rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all relative"
                  aria-label="Open chat"
                >
                  <ChatBubbleLeftIcon className="w-6 h-6 text-white" />
                  {/* Unread indicator */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                </motion.button>

                {/* Spectate Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onSpectate}
                  className="aspect-square rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-all"
                  aria-label="Spectate mode"
                >
                  <UsersIcon className="w-6 h-6 text-white" />
                </motion.button>

                {/* Forfeit Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onForfeit}
                  className="aspect-square rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all"
                  aria-label="Forfeit game"
                >
                  <HandRaisedIcon className="w-6 h-6 text-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch Indicator */}
      {!showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto"
        >
          <div className="bg-black bg-opacity-70 backdrop-blur-md rounded-full px-4 py-2">
            <p className="text-white text-xs">👆 Tap to show controls</p>
          </div>
        </motion.div>
      )}

      {/* Game Progress Indicator */}
      {gameState === 'playing' && (
        <div className="fixed top-1/2 left-4 transform -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-black bg-opacity-80 backdrop-blur-md rounded-full p-3">
            <div className="w-2 h-16 bg-gray-700 rounded-full relative overflow-hidden">
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-blue-500 rounded-full"
                initial={{ height: '100%' }}
                animate={{
                  height: timeRemaining
                    ? `${(timeRemaining / 60) * 100}%`
                    : '100%',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Winner Celebration */}
      <AnimatePresence>
        {gameState === 'finished' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
          >
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-8 text-center shadow-2xl">
              <TrophyIcon className="w-16 h-16 text-white mx-auto mb-4" />
              <h2 className="text-white text-2xl font-bold mb-2">🎉 Winner!</h2>
              <p className="text-white text-lg mb-4">{currentPlayer}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-orange-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @media (max-width: 640px) {
          .fixed.bottom-20 {
            bottom: calc(5rem + env(safe-area-inset-bottom));
          }
        }

        /* Custom vibration for mobile haptic feedback */
        @media (max-width: 768px) {
          button:active {
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
};

export default MobileGameControls;

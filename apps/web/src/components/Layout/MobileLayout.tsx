'use client';

import {
  Bars3Icon,
  CogIcon,
  HomeIcon,
  MapIcon,
  TrophyIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Map', href: '/world-hub-map', icon: MapIcon },
  { label: 'Tournaments', href: '/tournaments', icon: TrophyIcon },
  { label: 'Profile', href: '/profile', icon: UserIcon, requiresAuth: true },
  { label: 'Settings', href: '/settings', icon: CogIcon },
];

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle navigation with haptic feedback
  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      // Add haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      router.push(href);
    }
    setIsMenuOpen(false);
  };

  // Detect if we're on a game page
  const isGamePage =
    pathname?.includes('/game') || pathname?.includes('/match');
  const isVenuePage = pathname?.includes('/venue');

  return (
    <div className="mobile-game-optimized">
      {/* Main Content */}
      <main
        className={`mobile-container ${isGamePage ? 'mobile-game-page' : ''}`}
      >
        {/* Online/Offline Status Banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50"
            >
              You're offline. Some features may not work.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className={`pt-4 pb-20 ${!isOnline ? 'mt-10' : ''}`}>
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      {!isGamePage && !isVenuePage && (
        <nav className="mobile-nav">
          <div className="mobile-nav-content">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`mobile-nav-item mobile-touch-target ${
                    isActive ? 'active' : ''
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="mobile-nav-icon" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Game Controls Overlay for Game Pages */}
      {isGamePage && (
        <div className="mobile-game-controls">
          <div className="mobile-control-pad">
            <button
              className="mobile-control-btn"
              onClick={() => handleNavigation('/world-hub-map')}
              aria-label="Back to Map"
            >
              🗺️
            </button>

            <button
              className="mobile-control-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Game Menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <button
              className="mobile-control-btn"
              onClick={() => handleNavigation('/profile')}
              aria-label="Player Profile"
            >
              👤
            </button>
          </div>
        </div>
      )}

      {/* Game Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && isGamePage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white text-lg font-bold mb-4">Game Menu</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleNavigation('/settings');
                  }}
                  className="w-full mobile-btn mobile-btn-secondary"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    handleNavigation('/profile');
                  }}
                  className="w-full mobile-btn mobile-btn-secondary"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    handleNavigation('/');
                  }}
                  className="w-full mobile-btn mobile-btn-secondary"
                >
                  Main Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading States */}
      <style jsx global>{`
        .mobile-game-page {
          padding-bottom: 120px;
        }

        /* Custom scrollbar for mobile */
        ::-webkit-scrollbar {
          width: 4px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        ::-webkit-scrollbar-thumb {
          background: #4ecdc4;
          border-radius: 2px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #45b8ae;
        }

        /* Prevent zoom on input focus for iOS */
        @media screen and (max-width: 767px) {
          input[type='text'],
          input[type='email'],
          input[type='password'],
          select,
          textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileLayout;

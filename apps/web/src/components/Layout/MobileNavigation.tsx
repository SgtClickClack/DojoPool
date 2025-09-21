'use client';

import {
  BellIcon,
  ChatBubbleLeftIcon,
  CogIcon,
  HomeIcon,
  MapIcon,
  ShoppingBagIcon,
  TrophyIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

interface MobileNavigationProps {
  currentPath?: string;
  notifications?: number;
  messages?: number;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPath = '',
  notifications = 0,
  messages = 0,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: HomeIcon,
      path: '/dashboard',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'world',
      label: 'World',
      icon: MapIcon,
      path: '/world',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      icon: TrophyIcon,
      path: '/tournaments',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      path: '/profile',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  const quickActions = [
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: ShoppingBagIcon,
      path: '/marketplace',
      color: 'text-indigo-500',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: ChatBubbleLeftIcon,
      path: '/messages',
      color: 'text-pink-500',
      badge: messages > 0 ? messages : undefined,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      path: '/notifications',
      color: 'text-orange-500',
      badge: notifications > 0 ? notifications : undefined,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: CogIcon,
      path: '/settings',
      color: 'text-gray-500',
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (
      path === '/dashboard' &&
      (currentPath === '/' || currentPath === '/dashboard')
    ) {
      return true;
    }
    return currentPath.startsWith(path);
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 lg:hidden mobile-nav"
      >
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                  active
                    ? `${item.bgColor} ${item.color}`
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium mt-1">{item.label}</span>

                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute -top-1 w-8 h-1 rounded-full ${item.color.replace('text-', 'bg-')}`}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* Menu Toggle Button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
              isMenuOpen
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-6 h-6 relative">
              <span
                className={`absolute inset-0 transition-all duration-200 ${
                  isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1'
                }`}
              >
                <span
                  className={`block w-6 h-0.5 bg-current transition-all duration-200 ${
                    isMenuOpen ? 'rotate-90' : ''
                  }`}
                />
              </span>
              <span
                className={`block w-6 h-0.5 bg-current transition-all duration-200 ${
                  isMenuOpen ? 'opacity-0' : 'translate-y-1'
                }`}
              />
            </div>
            <span className="text-xs font-medium mt-1">Menu</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Expanded Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[70vh] overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close menu"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {quickActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <motion.button
                        key={action.id}
                        onClick={() => handleNavigation(action.path)}
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="relative">
                          <Icon className={`w-8 h-8 ${action.color}`} />
                          {action.badge && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {action.badge > 9 ? '9+' : action.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700 mt-2">
                          {action.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Additional Links */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleNavigation('/help')}
                    className="w-full text-left p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Help & Support
                  </button>
                  <button
                    onClick={() => handleNavigation('/feedback')}
                    className="w-full text-left p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Send Feedback
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Safe Area Spacer */}
      <div className="h-20 lg:hidden" />
    </>
  );
};

export default MobileNavigation;

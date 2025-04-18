import React from 'react';
import { EmojiEvents } from '@mui/icons-material';

interface NavigationItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  requiresAuth: boolean;
}

const navigationItems: Array<NavigationItem> = [
  {
    label: 'Rankings',
    icon: React.createElement(EmojiEvents),
    path: '/rankings',
    requiresAuth: true
  }
  // Add other valid navigation items here if they exist
  // Example:
  // {
  //   label: 'Profile',
  //   icon: React.createElement(AccountCircle), // Assuming AccountCircle is imported
  //   path: '/profile',
  //   requiresAuth: true
  // }
];

export default navigationItems;

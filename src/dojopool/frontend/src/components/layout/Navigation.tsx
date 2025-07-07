import React from 'react';
import { EmojiEvents } from '@mui/icons-material';

interface NavigationItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  requiresAuth: boolean;
}

// Assuming this array holds your primary navigation structure
const navigationItems: Array<NavigationItem> = [
  {
    label: 'Rankings',
    icon: <EmojiEvents />, // Using JSX syntax
    path: '/rankings',
    requiresAuth: true,
  },
  // Add other navigation items here following the same structure
  // e.g.:
  // {
  //   label: 'Home',
  //   icon: <HomeIcon />,
  //   path: '/',
  //   requiresAuth: false,
  // },
];

// You likely need to export this array or use it within a component
export default navigationItems;

// Removed the duplicate/incomplete object from the end
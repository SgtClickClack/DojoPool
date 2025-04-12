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
];

export default navigationItems;

// ... existing menu items ...
{
  label: 'Rankings',
  icon: <EmojiEvents />,
  path: '/rankings',
  requiresAuth: true
},
// ... rest of the file ... 
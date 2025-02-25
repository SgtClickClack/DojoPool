import React from 'react';
import { EmojiEvents } from '@mui/icons-material';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  requiresAuth: boolean;
}

const menuItems: MenuItem[] = [
  {
    label: 'Rankings',
    icon: <EmojiEvents />,
    path: '/rankings',
    requiresAuth: true
  }
];

export const Navigation: React.FC = () => {
  return (
    <nav>
      {menuItems.map((item) => (
        <div key={item.path}>
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
};

export default Navigation; 
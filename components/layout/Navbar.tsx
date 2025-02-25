import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  EmojiEvents,
  Place,
  SportsBar,
  Analytics,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
    router.push('/');
  };

  const menuItems = [
    { text: 'Tournaments', icon: React.createElement(EmojiEvents), href: '/tournaments' },
    { text: 'Venues', icon: React.createElement(Place), href: '/venues' },
    { text: 'Games', icon: React.createElement(SportsBar), href: '/games' },
    { text: 'Analytics', icon: React.createElement(Analytics), href: '/analytics' },
  ];

  return React.createElement(
    AppBar,
    { position: 'static' },
    React.createElement(
      Toolbar,
      null,
      React.createElement(
        IconButton,
        {
          edge: 'start',
          color: 'inherit',
          'aria-label': 'menu',
          onClick: handleMobileMenu,
          sx: { mr: 2, display: { sm: 'none' } },
        },
        React.createElement(MenuIcon)
      ),

      React.createElement(
        Typography,
        { variant: 'h6', component: 'div', sx: { flexGrow: 1 } },
        React.createElement(
          Link,
          { href: '/', passHref: true, style: { textDecoration: 'none', color: 'inherit' } },
          'DojoPool'
        )
      ),

      React.createElement(
        Box,
        { sx: { display: { xs: 'none', sm: 'flex' }, alignItems: 'center' } },
        menuItems.map((item) =>
          React.createElement(
            Button,
            {
              key: item.text,
              color: 'inherit',
              startIcon: item.icon,
              component: Link,
              href: item.href,
            },
            item.text
          )
        )
      ),

      user
        ? React.createElement(
            Box,
            { sx: { display: 'flex', alignItems: 'center' } },
            React.createElement(
              IconButton,
              {
                size: 'large',
                'aria-label': 'account of current user',
                'aria-controls': 'menu-appbar',
                'aria-haspopup': 'true',
                onClick: handleMenu,
                color: 'inherit',
              },
              user.avatar
                ? React.createElement(Avatar, { alt: user.username, src: user.avatar })
                : React.createElement(AccountCircle)
            ),
            React.createElement(
              Menu,
              {
                id: 'menu-appbar',
                anchorEl,
                anchorOrigin: {
                  vertical: 'top',
                  horizontal: 'right',
                },
                keepMounted: true,
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'right',
                },
                open: Boolean(anchorEl),
                onClose: handleClose,
              },
              React.createElement(
                MenuItem,
                { component: Link, href: '/profile', onClick: handleClose },
                'Profile'
              ),
              React.createElement(
                MenuItem,
                { component: Link, href: '/settings', onClick: handleClose },
                'Settings'
              ),
              React.createElement(MenuItem, { onClick: handleLogout }, 'Logout')
            )
          )
        : React.createElement(
            Box,
            null,
            React.createElement(
              Button,
              { color: 'inherit', component: Link, href: '/login' },
              'Login'
            ),
            React.createElement(
              Button,
              { color: 'inherit', component: Link, href: '/register' },
              'Register'
            )
          ),

      React.createElement(
        Menu,
        {
          id: 'mobile-menu',
          anchorEl: mobileMenuAnchorEl,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
          keepMounted: true,
          transformOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
          open: Boolean(mobileMenuAnchorEl),
          onClose: handleClose,
        },
        menuItems.map((item) =>
          React.createElement(
            MenuItem,
            {
              key: item.text,
              component: Link,
              href: item.href,
              onClick: handleClose,
            },
            item.icon,
            React.createElement(Typography, { sx: { ml: 1 } }, item.text)
          )
        )
      )
    )
  );
};

export default Navbar; 
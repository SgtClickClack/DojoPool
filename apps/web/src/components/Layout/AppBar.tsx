import NotificationBell from '@/components/Common/NotificationBell';
import WebSocketStatus from '@/components/Common/WebSocketStatus';
import DojoCoinWallet from '@/components/Economy/DojoCoinWallet';
import LanguageSwitcher from '@/components/Language/LanguageSwitcher';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import {
  AppBarProps,
  Avatar,
  Badge,
  Box,
  Button,
  Menu,
  MenuItem,
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import React, { useState } from 'react';

/**
 * DojoPoolAppBar - The main application bar for the DojoPool frontend.
 * Handles navigation and branding for the app with conditional auth links.
 *
 * @component
 * @returns {JSX.Element}
 */
const DojoPoolAppBar: React.FC<AppBarProps> = (props) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { unreadCount } = useChat();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <MuiAppBar {...props}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            DojoPool
          </Link>
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <LanguageSwitcher />
          <WebSocketStatus compact />
          <Link href="/">
            <Button color="inherit">World Map</Button>
          </Link>
          <Link href="/tournaments">
            <Button color="inherit">Tournaments</Button>
          </Link>
          <Link href="/clan-wars">
            <Button color="inherit">Clan Wars</Button>
          </Link>
          <Link href="/battle-pass">
            <Button color="inherit">Battle Pass</Button>
          </Link>
          <Link href="/websocket-demo">
            <Button color="inherit">Live Demo</Button>
          </Link>
          <Link href="/marketplace">
            <Button color="inherit">Marketplace</Button>
          </Link>
          <Link href="/store">
            <Button color="inherit">Store</Button>
          </Link>
          <Link href="/messages">
            <Button color="inherit">
              Messages
              {unreadCount > 0 && (
                <Badge badgeContent={unreadCount} color="error" />
              )}
            </Button>
          </Link>

          {/* Notification Bell */}
          <NotificationBell />

          {user ? (
            <>
              {/* DojoCoin Wallet */}
              <DojoCoinWallet showPurchaseButton={true} compact={true} />

              <Button
                onClick={handleMenu}
                sx={{ color: 'inherit', textTransform: 'none' }}
                startIcon={
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem' }}>
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                }
              >
                {user.username}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleClose}>
                  <Link
                    href="/profile"
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      width: '100%',
                    }}
                  >
                    Profile
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <Link
                    href="/profile/inventory"
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      width: '100%',
                    }}
                  >
                    Inventory
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Link href="/auth/register">
                <Button
                  variant="contained"
                  sx={{
                    mr: 1,
                    px: 3,
                    py: 1,
                  }}
                >
                  Sign Up
                </Button>
              </Link>
              <Link href="/login">
                <Button color="inherit" variant="outlined">
                  Login
                </Button>
              </Link>
            </>
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default DojoPoolAppBar;

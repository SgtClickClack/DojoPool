import NotificationBell from '@/components/Common/NotificationBell';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import marketplaceService, {
  type UserBalance,
} from '@/services/marketplaceService';
import { AttachMoney as MoneyIcon } from '@mui/icons-material';
import {
  type AppBarProps,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

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
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const { unreadCount } = useChat();

  useEffect(() => {
    if (user) {
      const fetchBalance = async () => {
        try {
          const balance = await marketplaceService.getUserBalance();
          setUserBalance(balance);
        } catch (error) {
          console.error('Failed to fetch user balance:', error);
        }
      };
      fetchBalance();
    }
  }, [user]);

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
          <Link href="/" className="link-no-decoration">
            DojoPool
          </Link>
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Link href="/">
            <Button color="inherit">World Map</Button>
          </Link>
          <Link href="/tournaments">
            <Button color="inherit">Tournaments</Button>
          </Link>
          <Link href="/clan-wars">
            <Button color="inherit">Clan Wars</Button>
          </Link>
          <Link href="/marketplace">
            <Button color="inherit">Marketplace</Button>
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
              {/* Currency Display */}
              {userBalance && (
                <Chip
                  icon={<MoneyIcon sx={{ color: '#ffd700' }} />}
                  label={`${userBalance.dojoCoins.toLocaleString()}`}
                  variant="outlined"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiChip-label': {
                      color: 'white',
                    },
                  }}
                />
              )}

              <Button
                onClick={handleMenu}
                sx={{ color: 'inherit', textTransform: 'none' }}
                startIcon={
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem' }}>
                    {user?.username?.charAt(0)?.toUpperCase() || '?'}
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
                    className="link-no-decoration"
                    style={{ width: '100%' }}
                  >
                    Profile
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <Link
                    href="/profile/inventory"
                    className="link-no-decoration"
                    style={{ width: '100%' }}
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
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: '#1565c0',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(25, 118, 210, 0.3)',
                    },
                    transition: 'all 0.2s ease-in-out',
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

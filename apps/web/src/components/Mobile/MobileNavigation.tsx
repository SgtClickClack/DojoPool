import { useAuth } from '@/hooks/useAuth';
import { useDevice, useIsMobile } from '@/hooks/useDevice';
import {
  Group as ClanIcon,
  Home as HomeIcon,
  ShoppingCart as MarketplaceIcon,
  Menu as MenuIcon,
  Message as MessageIcon,
  Notifications as NotificationIcon,
  PlayArrow as PlayIcon,
  AccountCircle as ProfileIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  EmojiEvents as TournamentIcon,
} from '@mui/icons-material';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  SwipeableDrawer,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

interface MobileNavigationProps {
  children?: React.ReactNode;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ children }) => {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { orientation } = useDevice();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(0);

  // Navigation items
  const navigationItems = [
    { label: 'Home', icon: HomeIcon, path: '/', value: 0 },
    {
      label: 'Tournaments',
      icon: TournamentIcon,
      path: '/tournaments',
      value: 1,
    },
    { label: 'Battle Pass', icon: PlayIcon, path: '/battle-pass', value: 2 },
    {
      label: 'Marketplace',
      icon: MarketplaceIcon,
      path: '/marketplace',
      value: 3,
    },
    { label: 'Messages', icon: MessageIcon, path: '/messages', value: 4 },
  ];

  const drawerItems = [
    { label: 'Profile', icon: ProfileIcon, path: '/profile' },
    { label: 'Clan', icon: ClanIcon, path: '/clan' },
    { label: 'Inventory', icon: ProfileIcon, path: '/inventory' },
    { label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  // Update bottom navigation value based on current route
  useEffect(() => {
    const currentItem = navigationItems.find(
      (item) =>
        router.pathname === item.path ||
        router.pathname.startsWith(item.path + '/')
    );
    if (currentItem) {
      setBottomNavValue(currentItem.value);
    }
  }, [router.pathname]);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  // Only render mobile navigation on mobile devices
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          background: theme.cyberpunk.gradients.card,
          borderBottom: `1px solid ${theme.palette.primary.main}`,
          boxShadow: `0 2px 10px ${theme.palette.primary.main}30`,
        }}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => toggleDrawer(true)}
            sx={{ color: theme.palette.primary.main }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              color: theme.palette.primary.main,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            DojoPool
          </Typography>

          <IconButton
            color="inherit"
            sx={{ color: theme.palette.primary.main }}
            onClick={() => router.push('/search')}
          >
            <SearchIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          paddingTop: '56px', // Account for fixed app bar
          paddingBottom: orientation === 'portrait' ? '80px' : '56px', // Account for bottom nav
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          background: theme.cyberpunk.gradients.card,
          borderTop: `1px solid ${theme.palette.primary.main}`,
          boxShadow: `0 -2px 10px ${theme.palette.primary.main}30`,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={bottomNavValue}
          onChange={(event, newValue) => {
            setBottomNavValue(newValue);
            const item = navigationItems.find((nav) => nav.value === newValue);
            if (item) {
              handleNavigation(item.path);
            }
          }}
          sx={{
            background: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                },
              },
              minWidth: 'auto',
              padding: '6px 8px',
            },
          }}
        >
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                icon={<IconComponent />}
                sx={{
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.7rem',
                    mt: 0.5,
                  },
                }}
              />
            );
          })}
        </BottomNavigation>
      </Paper>

      {/* Side Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
        onOpen={() => toggleDrawer(true)}
        sx={{
          '& .MuiDrawer-paper': {
            background: theme.cyberpunk.gradients.card,
            borderRight: `1px solid ${theme.palette.primary.main}`,
            width: 280,
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.primary.main}30`,
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}
          >
            Menu
          </Typography>
          {user && (
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, mt: 1 }}
            >
              Welcome, {user.username}
            </Typography>
          )}
        </Box>

        <List sx={{ flexGrow: 1, pt: 1 }}>
          {drawerItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <ListItem
                key={item.path}
                button
                onClick={() => {
                  handleNavigation(item.path);
                  toggleDrawer(false);
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                  },
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                }}
              >
                <ListItemIcon
                  sx={{ color: theme.palette.primary.main, minWidth: 40 }}
                >
                  <IconComponent />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: theme.palette.text.primary,
                      fontWeight: 500,
                    },
                  }}
                />
              </ListItem>
            );
          })}
        </List>

        {/* Quick Actions */}
        <Box
          sx={{ p: 2, borderTop: `1px solid ${theme.palette.primary.main}30` }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: 1,
              fontWeight: 'bold',
            }}
          >
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Fab
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                },
                minWidth: 40,
                width: 40,
                height: 40,
              }}
              onClick={() => {
                router.push('/matchmaking');
                toggleDrawer(false);
              }}
            >
              <PlayIcon sx={{ fontSize: 20 }} />
            </Fab>
            <Fab
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
                },
                minWidth: 40,
                width: 40,
                height: 40,
              }}
              onClick={() => {
                router.push('/notifications');
                toggleDrawer(false);
              }}
            >
              <NotificationIcon sx={{ fontSize: 20 }} />
            </Fab>
          </Box>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
};

export default MobileNavigation;

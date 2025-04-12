import {
  Dashboard as DashboardIcon,
  SportsEsports as GameIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  EmojiEvents as TrophyIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CssBaseline,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Badge,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

const drawerWidth = 240;

// Background images array
const backgroundImages = [
  '/static/images/hero-bg.jpg',
  '/static/images/spacetable.webp',
  '/static/images/portalball.webp',
  '/static/images/octopus.webp',
  '/static/images/microchipball.webp',
  '/static/images/mask.webp',
  '/static/images/infinity.webp',
  '/static/images/fox.webp',
  '/static/images/dragon.webp',
  '/static/images/yinyang.webp',
];

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Background image rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000); // Change background every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img 
            src="/static/images/logo.jpg" 
            alt="DojoPool Logo" 
            style={{ 
              height: '40px', 
              width: 'auto',
              objectFit: 'contain'
            }} 
          />
          <Typography variant="h6" noWrap component="div" className="neon-text">
            DojoPool
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
      <List>
        <ListItem button className="glow-button">
          <ListItemIcon sx={{ color: '#00ff9f' }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button className="glow-button">
          <ListItemIcon sx={{ color: '#00ff9f' }}>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
        <ListItem button className="glow-button">
          <ListItemIcon sx={{ color: '#00ff9f' }}>
            <GameIcon />
          </ListItemIcon>
          <ListItemText primary="New Game" />
        </ListItem>
        <ListItem button className="glow-button">
          <ListItemIcon sx={{ color: '#00ff9f' }}>
            <TrophyIcon />
          </ListItemIcon>
          <ListItemText primary="Leaderboard" />
        </ListItem>
      </List>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
      <List>
        <ListItem button onClick={handleLogout} className="glow-button">
          <ListItemIcon sx={{ color: '#00ff9f' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', position: 'relative' }}>
      <CssBaseline />
      {/* Background Image Container */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          overflow: 'hidden',
        }}
      >
        {backgroundImages.map((image, index) => (
          <Box
            key={image}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: index === currentBgIndex ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
            }}
          >
            <img
              src={image}
              alt={`Background ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </Box>
        ))}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 26, 0.85) 100%)',
          }}
        />
      </Box>

      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <img 
              src="/static/images/logo.jpg" 
              alt="DojoPool Logo" 
              style={{ 
                height: '40px', 
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
            <Typography variant="h6" noWrap component="div" className="neon-text">
              Welcome, {currentUser?.displayName || currentUser?.email}
            </Typography>
          </Box>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <SettingsIcon />
          </IconButton>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            className="glow-button"
            sx={{
              background: 'linear-gradient(45deg, #00ff9f 30%, #00b36f 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #33ffb5 30%, #00ff9f 90%)',
              },
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Toolbar />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card className="neon-border">
              <CardContent>
                <Typography variant="h5" gutterBottom className="neon-text">
                  Quick Stats
                </Typography>
                <Typography variant="body1">
                  Games Played: 24
                </Typography>
                <Typography variant="body1">
                  Win Rate: 75%
                </Typography>
                <Typography variant="body1">
                  Current Rank: Gold III
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card className="neon-border">
              <CardContent>
                <Typography variant="h5" gutterBottom className="neon-text">
                  Recent Activity
                </Typography>
                <Typography variant="body1">
                  Last Game: Victory
                </Typography>
                <Typography variant="body1">
                  Streak: 3 wins
                </Typography>
                <Typography variant="body1">
                  Next Tournament: 2 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card className="neon-border">
              <CardContent>
                <Typography variant="h5" gutterBottom className="neon-text">
                  Welcome to DojoPool!
                </Typography>
                <Typography paragraph>
                  This is your gaming dashboard where you can manage your games, view statistics, 
                  and track your progress. Compete in tournaments, climb the leaderboards, and 
                  become a pool legend!
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  className="glow-button"
                  sx={{
                    background: 'linear-gradient(45deg, #00ff9f 30%, #00b36f 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #33ffb5 30%, #00ff9f 90%)',
                    },
                  }}
                >
                  Start New Game
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

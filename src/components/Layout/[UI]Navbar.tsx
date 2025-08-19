import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  SwipeableDrawer,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../../frontend/contexts/AuthContext';
import notificationService from '../../services/NotificationService';
import DojoPoolAppBar from '../AppBar';
import NotificationCenter from './[NOTIFY]NotificationCenter';

const publicPages = [
  { title: 'Home', path: '/' },
  { title: 'Games', path: '/games' },
  { title: 'Tournaments', path: '/tournaments' },
  { title: 'Leaderboard', path: '/leaderboard' },
];

const userPages = [
  { title: 'Profile', path: '/profile' },
  { title: 'Settings', path: '/settings' },
];

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut, user } = useAuth();

  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  const requestNotificationPermission = async () => {
    try {
      const granted = await notificationService.requestNotificationPermission();
      if (granted) {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    signOut();
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        {publicPages.map((page) => (
          <ListItem
            button
            key={page.title}
            component={RouterLink}
            to={page.path}
            onClick={handleDrawerToggle}
          >
            <ListItemText primary={page.title} />
          </ListItem>
        ))}
      </List>
      {user && (
        <>
          <Divider />
          <List>
            {userPages.map((page) => (
              <ListItem
                button
                key={page.title}
                component={RouterLink}
                to={page.path}
                onClick={handleDrawerToggle}
              >
                <ListItemText primary={page.title} />
              </ListItem>
            ))}
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );

  return (
    <DojoPoolAppBar position="fixed">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            DojoPool
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleDrawerToggle}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <SwipeableDrawer
              anchor="left"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              onOpen={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
            >
              {drawer}
            </SwipeableDrawer>
          </Box>

          {/* Mobile Logo */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              display: { xs: 'flex', md: 'none' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            DojoPool
          </Typography>

          {/* Desktop Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {publicPages.map((page) => (
              <Button
                key={page.title}
                component={RouterLink}
                to={page.path}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.title}
              </Button>
            ))}
          </Box>

          {/* Right Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user && <NotificationCenter />}
            {user ? (
              <>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar
                      alt={user?.displayName || 'User'}
                      src={user?.photoURL || '/static/images/avatar/2.jpg'}
                    />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  {userPages.map((page) => (
                    <MenuItem
                      key={page.title}
                      component={RouterLink}
                      to={page.path}
                      onClick={handleCloseUserMenu}
                    >
                      <Typography textAlign="center">{page.title}</Typography>
                    </MenuItem>
                  ))}
                  <MenuItem onClick={handleLogout}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                sx={{ color: 'white' }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </DojoPoolAppBar>
  );
};

export default Navbar;

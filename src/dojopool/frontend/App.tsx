import { Routes, Route } from 'react-router-dom';
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import { AuthProvider } from '@/contexts/AuthContext';
import PrivateRoute from '@/components/auth/PrivateRoute';
import Navbar from '@components/layout/Navbar';
import Home from '@components/pages/Home';
import Game from '@components/pages/Game';
import Leaderboard from '@components/pages/Leaderboard';
import Profile from '@components/pages/Profile';
import Login from '@components/auth/Login';
import Register from '@components/auth/Register';
import NotFound from '@components/pages/NotFound';

const App = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AuthProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Toolbar /> {/* Spacer for fixed navbar */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            mt: isMobile ? 0 : 2,
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            '& > *': {
              maxWidth: '100%',
            },
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Protected Routes */}
            <Route
              path="/game/:gameId"
              element={
                <PrivateRoute>
                  <Game />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
      </Box>
    </AuthProvider>
  );
};

export default App; 
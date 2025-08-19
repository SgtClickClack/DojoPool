import { Menu as MenuIcon } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent)',
            animation: 'scanline 2s linear infinite',
          },
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexGrow: 1,
              }}
            >
              <Link
                to="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                <Box
                  sx={{ position: 'relative', width: 40, height: 40, mr: 1 }}
                >
                  <img
                    src="/images/logo.webp"
                    alt="DojoPool Logo"
                    style={{
                      objectFit: 'contain',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  className="neon-text hover-glow"
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    background: 'linear-gradient(45deg, #00ffff, #0066ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  DojoPool
                </Typography>
              </Link>
            </Box>

            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{
                display: { xs: 'block', md: 'none' },
                color: '#fff',
                '&:hover': {
                  color: '#00ffff',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
      <Toolbar /> {/* Spacer for fixed AppBar */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          background: 'rgba(18, 18, 18, 0.8)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0, 255, 255, 0.1)',
        }}
      >
        <Container maxWidth="sm">
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
            }}
          >
            © {new Date().getFullYear()} DojoPool. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

import { Analytics, ExpandMore, Mic, School } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Container,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const Navbar = () => {
  const [aiMenuAnchor, setAiMenuAnchor] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const handleAiMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAiMenuAnchor(event.currentTarget);
  };

  const handleAiMenuClose = () => {
    setAiMenuAnchor(null);
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        background:
          'linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(26,26,26,0.95) 50%, rgba(10,10,10,0.95) 100%)',
        borderBottom: '1px solid rgba(0,255,157,0.3)',
        boxShadow: '0 4px 20px rgba(0,255,157,0.2)',
        backdropFilter: 'blur(20px)',
        zIndex: 1200,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo */}
          <Link href="/" passHref>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                mr: 3,
                cursor: 'pointer',
              }}
            >
              <Image
                src="/images/logo.webp"
                alt="DojoPool Logo"
                width={40}
                height={40}
                style={{
                  marginRight: 12,
                  borderRadius: 8,
                  boxShadow: '0 0 15px rgba(0,255,157,0.5)',
                }}
                priority
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  textShadow: '0 0 10px rgba(0,255,157,0.5)',
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 15px rgba(0,168,255,0.5)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                DojoPool
              </Typography>
            </Box>
          </Link>

          {/* Navigation Links */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Link href="/world-map" passHref>
              <Button
                sx={{
                  color: '#fff',
                  mx: 1,
                  '&:hover': {
                    color: '#00ff9d',
                    backgroundColor: 'rgba(0,255,157,0.1)',
                  },
                }}
              >
                World Map
              </Button>
            </Link>
            <Link href="/tournaments" passHref>
              <Button
                sx={{
                  color: '#fff',
                  mx: 1,
                  '&:hover': {
                    color: '#00ff9d',
                    backgroundColor: 'rgba(0,255,157,0.1)',
                  },
                }}
              >
                Tournaments
              </Button>
            </Link>
            <Link href="/analytics" passHref>
              <Button
                sx={{
                  color: '#fff',
                  mx: 1,
                  '&:hover': {
                    color: '#00ff9d',
                    backgroundColor: 'rgba(0,255,157,0.1)',
                  },
                }}
              >
                Analytics
              </Button>
            </Link>
          </Box>

          {/* AI Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button
              onClick={handleAiMenuOpen}
              sx={{
                color: '#00ff9d',
                border: '1px solid rgba(0,255,157,0.3)',
                '&:hover': {
                  borderColor: '#00a8ff',
                  color: '#00a8ff',
                },
              }}
              endIcon={<ExpandMore />}
            >
              AI Features
            </Button>
            <Menu
              anchorEl={aiMenuAnchor}
              open={Boolean(aiMenuAnchor)}
              onClose={handleAiMenuClose}
              sx={{
                '& .MuiPaper-root': {
                  backgroundColor: 'rgba(10,10,10,0.95)',
                  border: '1px solid rgba(0,255,157,0.3)',
                  backdropFilter: 'blur(20px)',
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  router.push('/ai-commentary');
                  handleAiMenuClose();
                }}
              >
                <ListItemIcon>
                  <Mic sx={{ color: '#00ff9d' }} />
                </ListItemIcon>
                AI Commentary
              </MenuItem>
              <MenuItem
                onClick={() => {
                  router.push('/ai-match-analysis');
                  handleAiMenuClose();
                }}
              >
                <ListItemIcon>
                  <Analytics sx={{ color: '#00ff9d' }} />
                </ListItemIcon>
                Match Analysis
              </MenuItem>
              <MenuItem
                onClick={() => {
                  router.push('/ai/coaching');
                  handleAiMenuClose();
                }}
              >
                <ListItemIcon>
                  <School sx={{ color: '#00ff9d' }} />
                </ListItemIcon>
                AI Coaching
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;

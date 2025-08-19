import {
  Analytics,
  Assessment,
  AutoAwesome,
  Build,
  Business,
  ExpandMore,
  Gavel,
  LocalOffer,
  Mic,
  MonetizationOn,
  Palette,
  People,
  Psychology,
  School,
  Speed,
  Storefront,
  VideoLibrary,
  ViewInAr,
} from '@mui/icons-material';
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

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Link href="/dashboard" passHref>
              <Button
                aria-label="Go to Dashboard"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button
                aria-label="Explore World Map"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                World Map
              </Button>
            </Link>
            <Link href="/clan-wars" passHref>
              <Button
                aria-label="Open Clan Wars"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                Clan Wars
              </Button>
            </Link>
            <Link href="/tournaments" passHref>
              <Button
                aria-label="View Tournaments"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                Tournaments
              </Button>
            </Link>
            <Link href="/friends" passHref>
              <Button
                aria-label="Friends & Social"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                Friends
              </Button>
            </Link>
            <Link href="/dojos/customize" passHref>
              <Button
                aria-label="Dojo Customization"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                Customize
              </Button>
            </Link>
            <Link href="/ai-commentary" passHref>
              <Button
                aria-label="AI Commentary"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                AI Commentary
              </Button>
            </Link>
            <Link href="/avatar-progression" passHref>
              <Button
                aria-label="Avatar Progression"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                Avatar
              </Button>
            </Link>
            <Link href="/game-mechanics" passHref>
              <Button
                aria-label="Game Mechanics"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                Game Mechanics
              </Button>
            </Link>
            <Link href="/ledger" passHref>
              <Button
                aria-label="Open Ledger"
                sx={{
                  color: '#00ff9d',
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mx: 2,
                  '&:hover': {
                    color: '#00a8ff',
                    textShadow: '0 0 10px rgba(0,168,255,0.5)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                Ledger
              </Button>
            </Link>

            {/* AI Features Dropdown */}
            <Button
              onClick={handleAiMenuOpen}
              endIcon={<ExpandMore />}
              sx={{
                color: '#00ff9d',
                display: 'block',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                '&:hover': {
                  color: '#00a8ff',
                  textShadow: '0 0 10px rgba(0,168,255,0.5)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              AI Features
            </Button>

            <Menu
              anchorEl={aiMenuAnchor}
              open={Boolean(aiMenuAnchor)}
              onClose={handleAiMenuClose}
              sx={{
                '& .MuiPaper-root': {
                  background: 'rgba(20, 20, 20, 0.95)',
                  border: '1px solid rgba(0, 255, 157, 0.3)',
                  borderRadius: 2,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 255, 157, 0.3)',
                },
              }}
            >
              <MenuItem
                component={Link}
                href="/ai/match-analysis"
                onClick={handleAiMenuClose}
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    color: '#00a8ff',
                  },
                }}
              >
                <ListItemIcon>
                  <Psychology sx={{ color: '#00ff9d' }} />
                </ListItemIcon>
                AI Match Analysis
              </MenuItem>
              <MenuItem
                component={Link}
                href="/voice-assistant"
                onClick={handleAiMenuClose}
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    color: '#00a8ff',
                  },
                }}
              >
                <ListItemIcon>
                  <Mic sx={{ color: '#00ff9d' }} />
                </ListItemIcon>
                Voice Assistant
              </MenuItem>
              <MenuItem
                component={Link}
                href="/ai/coaching"
                onClick={handleAiMenuClose}
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    color: '#00a8ff',
                  },
                }}
              >
                <ListItemIcon>
                  <School sx={{ color: 'inherit' }} />
                </ListItemIcon>
                AI Coaching
              </MenuItem>
              <MenuItem
                component={Link}
                href="/ai/advanced-match-analysis"
                onClick={handleAiMenuClose}
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    color: '#00a8ff',
                  },
                }}
              >
                <ListItemIcon>
                  <Analytics sx={{ color: 'inherit' }} />
                </ListItemIcon>
                Advanced Analysis
              </MenuItem>
              <MenuItem
                component={Link}
                href="/performance/tournament-performance"
                onClick={handleAiMenuClose}
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    color: '#00a8ff',
                  },
                }}
              >
                <ListItemIcon>
                  <Speed sx={{ color: 'inherit' }} />
                </ListItemIcon>
                Performance
              </MenuItem>
              <MenuItem
                component={Link}
                href="/tournaments/bracket-visualization"
                onClick={handleAiMenuClose}
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    color: '#00a8ff',
                  },
                }}
              >
                <ListItemIcon>
                  <ViewInAr sx={{ color: 'inherit' }} />
                </ListItemIcon>
                3D Bracket
              </MenuItem>
              <MenuItem
                component={Link}
                href="/tournaments/commentary"
                onClick={handleAiMenuClose}
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    color: '#00a8ff',
                  },
                }}
              >
                <ListItemIcon>
                  <Mic sx={{ color: 'inherit' }} />
                </ListItemIcon>
                AI Commentary
              </MenuItem>
              <MenuItem
                component={Link}
                href="/tournaments/prediction"
                onClick={handleAiMenuClose}
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    color: '#00a8ff',
                  },
                }}
              >
                <ListItemIcon>
                  <AutoAwesome sx={{ color: 'inherit' }} />
                </ListItemIcon>
                AI Prediction
              </MenuItem>
            </Menu>

            <Button
              component={Link}
              href="/Social"
              sx={{
                color: '#00ff9d',
                display: 'block',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                '&:hover': {
                  color: '#00a8ff',
                  textShadow: '0 0 10px rgba(0,168,255,0.5)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <People sx={{ mr: 1 }} />
              Social Hub
            </Button>

            <Button
              component={Link}
              href="/referee/advanced-ai-referee"
              sx={{
                color: '#00ff9d',
                display: 'block',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                '&:hover': {
                  color: '#00a8ff',
                  textShadow: '0 0 10px rgba(0,168,255,0.5)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <Gavel sx={{ mr: 1 }} />
              AI Referee
            </Button>

            <Button
              component={Link}
              href="/game-replay"
              sx={{
                color: '#00ff9d',
                display: 'block',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                '&:hover': {
                  color: '#00a8ff',
                  textShadow: '0 0 10px rgba(0,168,255,0.5)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <VideoLibrary sx={{ mr: 1 }} />
              Game Replay
            </Button>

            <Button
              component={Link}
              href="/analytics/tournament-analytics"
              sx={{
                color: '#00ff9d',
                display: 'block',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                '&:hover': {
                  color: '#00a8ff',
                  textShadow: '0 0 10px rgba(0,168,255,0.5)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <Analytics sx={{ mr: 1 }} />
              Analytics
            </Button>

            <Button
              color="inherit"
              component={Link}
              href="/mobile"
              sx={{
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Mobile
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/blockchain"
              sx={{
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Blockchain
            </Button>
            <Button
              component={Link}
              href="/nft-marketplace"
              sx={{
                color: '#00ff9d',
                display: 'block',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                '&:hover': {
                  color: '#00a8ff',
                  textShadow: '0 0 10px rgba(0,168,255,0.5)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <Storefront sx={{ mr: 1 }} />
              NFT Marketplace
            </Button>
            <Button
              component={Link}
              href="/advanced-venue-analytics"
              sx={{
                color: '#00ff9d',
                display: 'block',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                '&:hover': {
                  color: '#00a8ff',
                  textShadow: '0 0 10px rgba(0,168,255,0.5)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <Analytics sx={{ mr: 1 }} />
              Advanced Analytics
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/security"
              sx={{
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Security
            </Button>
            <Button
              color="inherit"
              onClick={() => router.push('/streaming')}
              sx={{ color: '#ffffff', '&:hover': { color: '#00ff9d' } }}
            >
              Streaming
            </Button>
            <Button
              color="inherit"
              onClick={() => router.push('/venues')}
              sx={{ color: '#ffffff', '&:hover': { color: '#00ff9d' } }}
            >
              Venues
            </Button>
            <Button
              color="inherit"
              href="/compliance/tournament-compliance"
              sx={{ ml: 2 }}
            >
              Compliance
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/venue/venue-management"
              startIcon={<Business />}
              sx={{ mr: 1 }}
            >
              Venue Management
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/venue/dojo-profile"
              startIcon={<Palette />}
              sx={{ mr: 1 }}
            >
              Dojo Profile
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/venue/dojo-profile-customization"
              startIcon={<AutoAwesome />}
              sx={{ mr: 1 }}
            >
              Profile Customization
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/venue/analytics"
              startIcon={<Assessment />}
              sx={{ mr: 1 }}
            >
              Venue Analytics
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/venue/equipment-management"
              startIcon={<Build />}
              sx={{ mr: 1 }}
            >
              Equipment Management
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/referee/ai-referee"
              startIcon={<Gavel />}
              sx={{ mr: 1 }}
            >
              AI Referee
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/advanced-analytics"
              startIcon={<Analytics />}
              sx={{ mr: 1 }}
            >
              Advanced Analytics
            </Button>
            <MenuItem onClick={() => router.push('/venue/dojo-coin-rewards')}>
              <MonetizationOn sx={{ mr: 1 }} />
              Dojo Coin Rewards
            </MenuItem>
            <MenuItem onClick={() => router.push('/venue/venue-specials')}>
              <LocalOffer sx={{ mr: 1 }} />
              Venue Specials
            </MenuItem>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;

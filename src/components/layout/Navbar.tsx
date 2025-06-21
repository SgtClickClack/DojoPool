import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  Psychology,
  School,
  Speed,
  ViewInAr,
  ExpandMore,
  Forum,
  Analytics,
} from "@mui/icons-material";
import { useState } from "react";

const Navbar = () => {
  const [aiMenuAnchor, setAiMenuAnchor] = useState<null | HTMLElement>(null);

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
        background: "linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(26,26,26,0.95) 50%, rgba(10,10,10,0.95) 100%)",
        borderBottom: "1px solid rgba(0,255,157,0.3)",
        boxShadow: "0 4px 20px rgba(0,255,157,0.2)",
        backdropFilter: "blur(20px)",
        zIndex: 1200
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              mr: 3
            }}
          >
            <img
              src="/images/logo.webp"
              alt="DojoPool Logo"
              style={{ width: 40, height: 40, marginRight: 12, borderRadius: 8, boxShadow: '0 0 15px rgba(0,255,157,0.5)' }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#00ff9d",
                fontFamily: 'Orbitron, monospace',
                textShadow: "0 0 10px rgba(0,255,157,0.5)",
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 15px rgba(0,168,255,0.5)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              DojoPool
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button
              component={RouterLink}
              to="/dashboard"
              sx={{ 
                color: "#00ff9d", 
                display: "block",
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 10px rgba(0,168,255,0.5)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Dashboard
            </Button>
            <Button
              component={RouterLink}
              to="/map"
              sx={{ 
                color: "#00ff9d", 
                display: "block",
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 10px rgba(0,168,255,0.5)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Map
            </Button>
            <Button
              component={RouterLink}
              to="/ledger"
              sx={{ 
                color: "#00ff9d", 
                display: "block",
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 10px rgba(0,168,255,0.5)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Ledger
            </Button>
            
            {/* AI Features Dropdown */}
            <Button
              onClick={handleAiMenuOpen}
              endIcon={<ExpandMore />}
              sx={{ 
                color: "#00ff9d", 
                display: "block",
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 10px rgba(0,168,255,0.5)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
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
                component={RouterLink}
                to="/ai/match-analysis"
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
                  <Psychology sx={{ color: 'inherit' }} />
                </ListItemIcon>
                Match Analysis
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/ai/coaching"
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
                component={RouterLink}
                to="/performance/tournament-performance"
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
                component={RouterLink}
                to="/tournaments/bracket-visualization"
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
            </Menu>

            <Button
              component={RouterLink}
              to="/social/tournament-social"
              sx={{ 
                color: "#00ff9d", 
                display: "block",
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 10px rgba(0,168,255,0.5)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              <Forum sx={{ mr: 1 }} />
              Social
            </Button>
            
            <Button
              component={RouterLink}
              to="/analytics/tournament-analytics"
              sx={{ 
                color: "#00ff9d", 
                display: "block",
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 10px rgba(0,168,255,0.5)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              <Analytics sx={{ mr: 1 }} />
              Analytics
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;

import {
  Dashboard as DashboardIcon,
  SportsEsports as GameIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  EmojiEvents as TrophyIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
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
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

const drawerWidth = 240;

// Background images array
const backgroundImages: string[] = [
  "/static/images/hero-bg.webp",
  "/static/images/spacetable.webp",
  "/static/images/portalball.webp",
  "/static/images/octopus.webp",
  "/static/images/microchipball.webp",
  "/static/images/mask.webp",
  "/static/images/infinity.webp",
  "/static/images/fox.webp",
  "/static/images/dragon.webp",
  "/static/images/yinyang.webp",
];

// Define a type for props if any, for now, an empty object as no props are explicitly passed
interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [currentBgIndex, setCurrentBgIndex] = useState<number>(0);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Background image rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1,
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
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  }

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img
            src="/static/images/logo.webp"
            alt="DojoPool Logo"
            style={{
              height: "40px",
              width: "auto",
              objectFit: "contain",
            }}
          />
          <Typography variant="h6" noWrap component="div" className="neon-text">
            DojoPool
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.12)" }} />
      <List>
        <ListItem button className="glow-button">
          <ListItemIcon sx={{ color: "#00ff9f" }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button className="glow-button">
          <ListItemIcon sx={{ color: "#00ff9f" }}>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
        <ListItem button className="glow-button">
          <ListItemIcon sx={{ color: "#00ff9f" }}>
            <GameIcon />
          </ListItemIcon>
          <ListItemText primary="New Game" />
        </ListItem>
        <ListItem button className="glow-button">
          <ListItemIcon sx={{ color: "#00ff9f" }}>
            <TrophyIcon />
          </ListItemIcon>
          <ListItemText primary="Leaderboard" />
        </ListItem>
      </List>
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.12)" }} />
      <List>
        <ListItem button onClick={handleLogout} className="glow-button">
          <ListItemIcon sx={{ color: "#00ff9f" }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex", position: "relative" }}>
      <CssBaseline />
      {/* Background Image Container */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          overflow: "hidden",
        }}
      >
        {backgroundImages.map((image, index) => (
          <Box
            key={image}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: index === currentBgIndex ? 1 : 0,
              transition: "opacity 1s ease-in-out",
            }}
          >
            <img
              src={image}
              alt={`Background ${index + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          </Box>
        ))}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 26, 0.85) 100%)",
          }}
        />
      </Box>

      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: "rgba(30, 30, 30, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}
          >
            <img
              src="/static/images/logo.webp"
              alt="DojoPool Logo"
              style={{
                height: "40px",
                width: "auto",
                objectFit: "contain",
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              className="neon-text"
            >
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
              background: "linear-gradient(45deg, #00ff9f 30%, #00b36f 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #33ffb5 30%, #00ff9f 90%)",
              },
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              background: "rgba(30, 30, 30, 0.85)",
              backdropFilter: "blur(5px)",
              color: "#fff",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              background: "rgba(20, 20, 20, 0.9)", // Darker for permanent drawer
              color: "#fff",
              borderRight: "1px solid rgba(255, 255, 255, 0.12)",
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
          overflow: "auto", // Ensure main content is scrollable if it overflows
        }}
      >
        <Toolbar /> {/* Necessary to offset content below AppBar */}
        {/* Main content for the dashboard will go here */}
        <Grid container spacing={3}>
          {/* Example Cards - Replace with actual dashboard content */}
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ background: "rgba(50, 50, 50, 0.7)", color: "#fff" }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  Games Played
                </Typography>
                <Typography variant="h2" sx={{ color: "#00ff9f" }}>
                  128
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ background: "rgba(50, 50, 50, 0.7)", color: "#fff" }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  Win Rate
                </Typography>
                <Typography variant="h2" sx={{ color: "#00ff9f" }}>
                  65%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ background: "rgba(50, 50, 50, 0.7)", color: "#fff" }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  Current Rank
                </Typography>
                <Typography variant="h2" sx={{ color: "#00ff9f" }}>
                  Diamond III
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* Add more dashboard widgets/components here */}
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard; 
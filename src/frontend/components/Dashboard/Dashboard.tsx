import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Container,
  CssBaseline,
  Divider,
  Paper,
  Grid,
  Link,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useUserProfile } from "../../contexts/UserContext";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import MessageIcon from "@mui/icons-material/Message";
import CreateGameForm from "./CreateGameForm";
import ActiveGamesList from "./ActiveGamesList";
import TournamentList from "./TournamentList";
import axiosInstance from "../../api/axiosInstance";

const Dashboard: React.FC = () => {
  const { signOut } = useAuth();
  const { profile: userProfile, isLoading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState<string>("Checking backend connectivity...");

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  useEffect(() => {
    axiosInstance.get("/")
      .then(res => {
        setApiStatus(`Backend API reachable: ${res.data}`);
      })
      .catch(err => {
        setApiStatus(`Backend API unreachable: ${err.message}`);
      });
  }, []);

  const displayName = profileLoading
    ? "Loading..."
    : userProfile?.username || userProfile?.email || "User";

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            DojoPool Dashboard
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {displayName}
          </Typography>
          <Button color="inherit" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", p: 3, mt: 8 }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom>
            Welcome, {userProfile?.username || "Player"}!
          </Typography>
          <Typography variant="body1" gutterBottom>
            {apiStatus}
          </Typography>

          {/* Main Content Area - Grid Layout */}
          <Grid container spacing={3}>
            {/* Left Column: Create Game & Active Games & Tournaments */}
            <Grid item xs={12} md={8}>
              <CreateGameForm />
              <Divider sx={{ my: 4 }} />
              <TournamentList />
              <Divider sx={{ my: 4 }} />
              <ActiveGamesList />
            </Grid>

            {/* Right Column: Social & Notifications Placeholders */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Notifications
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <NotificationsIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    No new notifications. (Placeholder)
                  </Typography>
                </Box>
                {/* TODO: Implement Notifications List/Feed */}
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Social
                </Typography>
                <Stack spacing={1}>
                  <Button
                    startIcon={<PeopleIcon />}
                    component={Link}
                    href="#"
                    variant="outlined"
                    sx={{ justifyContent: "flex-start" }}
                  >
                    Friends (Coming Soon)
                  </Button>
                  <Button
                    startIcon={<MessageIcon />}
                    component={Link}
                    href="#"
                    variant="outlined"
                    sx={{ justifyContent: "flex-start" }}
                  >
                    Messages (Coming Soon)
                  </Button>
                </Stack>
                {/* TODO: Implement Friends List / Messaging Preview */}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useUserProfile } from "../../contexts/UserContext";
import axiosInstance from "../../api/axiosInstance";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface GameHistory {
  id: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  date: string;
  score: string;
}

interface ProfileData {
  username: string;
  avatar: string;
  joinDate: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  achievements: Achievement[];
  recentGames: GameHistory[];
  rank: number;
  dojoCoins: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/profile");
        setProfileData(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load profile data. Please try again later.");
        console.error("Error fetching profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Profile Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Avatar
          src={profileData?.avatar}
          sx={{ width: 100, height: 100, mr: 3 }}
        />
        <Box>
          <Typography variant="h4" gutterBottom>
            {profileData?.username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Member since {new Date(profileData?.joinDate || "").toLocaleDateString()}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`Rank #${profileData?.rank}`}
              color="primary"
              sx={{ mr: 1 }}
            />
            <Chip
              label={`${profileData?.dojoCoins} Dojo Coins`}
              color="secondary"
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">{profileData?.totalGames}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Games
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">{profileData?.wins}</Typography>
            <Typography variant="body2" color="text.secondary">
              Wins
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">
              {profileData ? Math.round((profileData.wins / profileData.totalGames) * 100) : 0}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Win Rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Games */}
      <Typography variant="h6" gutterBottom>
        Recent Games
      </Typography>
      <List>
        {profileData?.recentGames.map((game) => (
          <ListItem key={game.id}>
            <ListItemAvatar>
              <Avatar>{game.result === "win" ? "W" : game.result === "loss" ? "L" : "D"}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={`vs ${game.opponent}`}
              secondary={`${game.score} • ${new Date(game.date).toLocaleDateString()}`}
            />
            <Chip
              label={game.result.toUpperCase()}
              color={
                game.result === "win"
                  ? "success"
                  : game.result === "loss"
                  ? "error"
                  : "default"
              }
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 3 }} />

      {/* Achievements */}
      <Typography variant="h6" gutterBottom>
        Achievements
      </Typography>
      <Grid container spacing={2}>
        {profileData?.achievements.map((achievement) => (
          <Grid item xs={12} sm={6} md={4} key={achievement.id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar src={achievement.icon} sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle1">{achievement.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {achievement.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default Profile; 
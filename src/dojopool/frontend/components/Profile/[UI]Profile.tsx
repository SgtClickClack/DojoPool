import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "Pool enthusiast and tournament player",
    location: "New York, USA",
  });

  const stats = [
    { label: "Games Played", value: "156" },
    { label: "Tournaments Won", value: "12" },
    { label: "Win Rate", value: "68%" },
    { label: "Ranking", value: "#42" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update API call
    setIsEditing(false);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Profile Info */}
        <Box sx={{ flex: { xs: '1', md: '2' } }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Box sx={{ position: "relative" }}>
                <Avatar sx={{ width: 100, height: 100 }} />
                <IconButton
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: "background.paper",
                  }}
                  size="small"
                >
                  <PhotoCamera />
                </IconButton>
              </Box>
              <Box sx={{ ml: 3 }}>
                <Typography variant="h5">
                  {user?.name || "Player Name"}
                </Typography>
                <Typography color="textSecondary">
                  Member since {new Date().getFullYear()}
                </Typography>
              </Box>
              <Box sx={{ ml: "auto" }}>
                {!isEditing ? (
                  <IconButton onClick={() => setIsEditing(true)}>
                    <EditIcon />
                  </IconButton>
                ) : (
                  <Box>
                    <IconButton color="primary" onClick={handleSubmit}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setIsEditing(false)}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box component="form">
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  disabled={!isEditing}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Stats */}
        <Box sx={{ flex: { xs: '1', md: '1' } }}>
          <Paper elevation={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Player Stats
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)' }, gap: 2 }}>
                  {stats.map((stat) => (
                    <Box key={stat.label} textAlign="center">
                      <Typography variant="h4">{stat.value}</Typography>
                      <Typography color="textSecondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

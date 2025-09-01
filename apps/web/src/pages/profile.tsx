import EditProfileModal from '@/components/EditProfileModal';
import JournalFeed from '@/components/profile/JournalFeed';
import { useAuth } from '@/hooks/useAuth';
import { type UserProfile } from '@/services/api/profile';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // For now, create a mock profile since we don't have the full API yet
      const mockProfile: UserProfile = {
        id: user?.id || 'demo-user-123',
        email: user?.email || 'demo@example.com',
        username: user?.username || 'DemoUser',
        role: 'USER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: {
          bio: 'Pool enthusiast and Dojo master in training.',
          avatarUrl: '',
          location: 'Brisbane, Australia',
          displayName: 'Demo User',
        },
      };
      setProfile(mockProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Avoid router usage during SSR to prevent build-time errors
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleEditProfile = () => {
    setEditModalOpen(true);
  };

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    // You could also update the global auth context here if needed
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <Typography>Loading profile...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              src={profile?.profile?.avatarUrl}
              sx={{ width: 80, height: 80, fontSize: '2rem', mr: 3 }}
            >
              {profile?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {profile?.profile?.displayName || profile?.username}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                @{profile?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile?.email}
              </Typography>
              {profile?.profile?.location && (
                <Chip
                  label={profile.profile.location}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          </Box>

          {profile?.profile?.bio && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                About
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {profile.profile.bio}
              </Typography>
            </Box>
          )}

          {/* Navigation Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="profile tabs"
            >
              <Tab label="Overview" />
              <Tab label="Journal" />
              <Tab label="Inventory" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Account Information
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      User ID: {profile?.id}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      Role: {profile?.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Member since:{' '}
                      {new Date(profile?.createdAt || '').toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleEditProfile}
                      >
                        Edit Profile
                      </Button>
                      <Button variant="outlined" fullWidth>
                        Change Password
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Box>
              <JournalFeed />
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Inventory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your inventory items will appear here.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {profile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onProfileUpdated={handleProfileUpdated}
          currentProfile={profile}
        />
      )}
    </Container>
  );
};

export default ProfilePage;

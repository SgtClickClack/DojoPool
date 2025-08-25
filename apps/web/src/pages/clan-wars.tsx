import { AccessTime, Group } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import PageBackground from '../components/Common/PageBackground';
import Layout from '../components/Layout/Layout';
import { useClanSystem } from '../hooks/useClanSystem';
import styles from './clan-wars.module.css';

const ClanWarsPage: React.FC = () => {
  const { clans, currentClan, loading, createClan, joinClan, leaveClan } =
    useClanSystem();

  const [showCreateClan, setShowCreateClan] = useState(false);
  const [clanForm, setClanForm] = useState({
    name: '',
    description: '',
  });

  // Mock data for demonstration
  const mockClans = [
    {
      id: '1',
      name: 'Phoenix Warriors',
      tag: 'PHX',
      members: 15,
      territories: 3,
      rating: 1850,
    },
    {
      id: '2',
      name: 'Shadow Clan',
      tag: 'SHD',
      members: 12,
      territories: 2,
      rating: 1720,
    },
    {
      id: '3',
      name: 'Dragon Slayers',
      tag: 'DRG',
      members: 18,
      territories: 4,
      rating: 1920,
    },
    {
      id: '4',
      name: 'Elite Pool Masters',
      tag: 'EPM',
      members: 8,
      territories: 1,
      rating: 1650,
    },
  ];

  const handleCreateClan = async () => {
    if (clanForm.name && clanForm.description) {
      await createClan(clanForm.name, clanForm.description);
      setShowCreateClan(false);
      setClanForm({
        name: '',
        description: '',
      });
    }
  };

  return (
    <Layout>
      <PageBackground variant="social">
        <Container
          maxWidth="lg"
          sx={{ py: 4, position: 'relative', zIndex: 1 }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow: '0 0 20px #00ff9d',
              mb: 2,
            }}
          >
            Clan Management
          </Typography>

          {/* Current Clan Status */}
          {currentClan && (
            <Paper
              sx={{
                p: 3,
                mb: 4,
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid #00ff9d',
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" sx={{ color: '#00ff9d', mb: 2 }}>
                🏰 Your Clan: {currentClan.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                    {currentClan.memberCount}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Members
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                    3
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Territories
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                    1850
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Rating
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                color="error"
                onClick={leaveClan}
                sx={{ mt: 2 }}
              >
                Leave Clan
              </Button>
            </Paper>
          )}

          {/* Clan Actions */}
          <Box sx={{ mb: 4 }}>
            <Button
              variant="contained"
              onClick={() => setShowCreateClan(true)}
              sx={{
                background: 'linear-gradient(45deg, #00ff9d, #00b8ff)',
                color: '#000',
                mr: 2,
              }}
            >
              Create New Clan
            </Button>
            {!currentClan && (
              <Button
                variant="outlined"
                sx={{ borderColor: '#00ff9d', color: '#00ff9d' }}
              >
                Join Existing Clan
              </Button>
            )}
          </Box>

          {/* Available Clans */}
          <Typography variant="h4" sx={{ color: '#fff', mb: 3 }}>
            Available Clans
          </Typography>
          <Grid container spacing={3}>
            {mockClans
              .filter((clan) => clan.id !== currentClan?.id)
              .map((clan) => (
                <Grid item xs={12} md={6} lg={4} key={clan.id}>
                  <Card
                    sx={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid #333',
                      '&:hover': {
                        borderColor: '#00ff9d',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#00ff9d', mb: 1 }}>
                        {clan.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                        Tag: {clan.tag}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          icon={<Group />}
                          label={`${clan.members} members`}
                          size="small"
                          sx={{ background: '#333', color: '#fff' }}
                        />
                        <Chip
                          icon={<AccessTime />}
                          label={`${clan.territories} territories`}
                          size="small"
                          sx={{ background: '#333', color: '#fff' }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                        Rating: {clan.rating}
                      </Typography>
                      {!currentClan && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => joinClan(clan.id)}
                          sx={{ borderColor: '#00ff9d', color: '#00ff9d' }}
                        >
                          Join Clan
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {/* Create Clan Modal */}
          {showCreateClan && (
            <Paper
              sx={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                p: 4,
                background: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid #00ff9d',
                borderRadius: 2,
                zIndex: 1000,
                minWidth: 400,
              }}
            >
              <Typography variant="h5" sx={{ color: '#00ff9d', mb: 3 }}>
                Create New Clan
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                  Clan Name
                </Typography>
                <input
                  type="text"
                  value={clanForm.name}
                  onChange={(e) =>
                    setClanForm({ ...clanForm, name: e.target.value })
                  }
                  placeholder="Enter clan name..."
                  aria-label="Clan Name"
                  className={styles['clan-input']}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                  Description
                </Typography>
                <textarea
                  value={clanForm.description}
                  onChange={(e) =>
                    setClanForm({ ...clanForm, description: e.target.value })
                  }
                  placeholder="Enter clan description..."
                  aria-label="Clan Description"
                  className={styles['clan-textarea']}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleCreateClan}
                  disabled={!clanForm.name || !clanForm.description}
                  sx={{
                    background: 'linear-gradient(45deg, #00ff9d, #00b8ff)',
                    color: '#000',
                  }}
                >
                  Create Clan
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowCreateClan(false)}
                  sx={{ borderColor: '#00ff9d', color: '#00ff9d' }}
                >
                  Cancel
                </Button>
              </Box>
            </Paper>
          )}
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default ClanWarsPage;

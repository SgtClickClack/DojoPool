import React from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import PageBackground from '@/components/Common/PageBackground';
import Layout from '@/components/Layout/Layout';
import VenueCard from '@/components/venue/VenueCard';
import { useAuth } from '@/hooks/useAuth';
import {
  getClanControlledDojos,
  getClanDetails,
  getClanShadowRuns,
  getVenues,
  initiateShadowRun,
  upgradeDojo,
} from '@/services/APIService';

import type { Clan } from '@/types/clan';

const ClanProfile: React.FC = () => {
  const router = useRouter();
  const { clanId } = router.query;
  const { user } = useAuth();

  const [clan, setClan] = useState<Clan | null>(null);
  const [dojos, setDojos] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedRunType, setSelectedRunType] = useState<'DATA_HEIST' | 'SABOTAGE'>('DATA_HEIST');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeVenueId, setUpgradeVenueId] = useState<string | null>(null);
  const [upgradeType, setUpgradeType] = useState<'income' | 'defense'>('income');

  const { data: allVenues } = useSWR('venues', getVenues);
  const { data: shadowRuns } = useSWR(
    clanId ? ['clan-shadow-runs', clanId] : null,
    ([, id]) => getClanShadowRuns(id as string)
  );

  useEffect(() => {
    if (clanId && typeof clanId === 'string') {
      getClanDetails(clanId).then(setClan).catch(console.error);
      getClanControlledDojos(clanId).then(setDojos).catch(console.error);
    }
  }, [clanId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleShadowRun = async () => {
    if (!clanId || !selectedVenueId || !selectedRunType) return;

    try {
      await initiateShadowRun(
        selectedVenueId,
        selectedRunType
      );
      setOpenModal(false);
      setSelectedVenueId(null);
      // Refresh shadow runs data
      if (clanId) {
        getClanShadowRuns(clanId as string).then(_data => {
          // Update shadow runs state if needed
        });
      }
    } catch (error) {
      console.error('Failed to initiate shadow run:', error);
    }
  };

  const handleUpgradeDojo = async () => {
    if (!clanId || !upgradeVenueId || !upgradeType) return;

    try {
      await upgradeDojo(upgradeVenueId, upgradeType);
      setUpgradeModalOpen(false);
      setUpgradeVenueId(null);
      // Refresh clan data
      if (clanId) {
        getClanDetails(clanId as string).then(setClan);
        getClanControlledDojos(clanId as string).then(setDojos);
      }
    } catch (error) {
      console.error('Failed to upgrade dojo:', error);
    }
  };

  if (!clan) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography>Loading clan details...</Typography>
        </Container>
      </Layout>
    );
  }

  const isLeader = user?.id === clan.leaderId;

  return (
    <Layout>
      <PageBackground>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {clan.name}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Treasury: {clan.dojoCoinBalance} Dojo Coins
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="clan tabs">
            <Tab label="Territories" />
            <Tab label="Shadow Runs" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                {isLeader && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setOpenModal(true)}
                    >
                      Initiate Shadow Run
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setUpgradeModalOpen(true)}
                    >
                      Upgrade Territory
                    </Button>
                  </>
                )}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                {dojos.map((dojo) => (
                  <VenueCard
                    key={dojo.id}
                    venue={dojo}
                    isLeader={isLeader}
                    onUpgrade={(venueId) => {
                      setUpgradeVenueId(venueId);
                      setUpgradeModalOpen(true);
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Shadow Runs History
              </Typography>
              {shadowRuns?.map((run: any) => (
                <Box key={run.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography>Type: {run.runType}</Typography>
                  <Typography>Target: {run.targetVenue?.name}</Typography>
                  <Typography>Status: {run.status}</Typography>
                  <Typography>Result: {run.result || 'Pending'}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Shadow Run Modal */}
        <Modal open={openModal} onClose={() => setOpenModal(false)}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
          }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Initiate Shadow Run
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Run Type</InputLabel>
              <Select
                value={selectedRunType}
                label="Run Type"
                onChange={(e) => setSelectedRunType(e.target.value as 'DATA_HEIST' | 'SABOTAGE')}
              >
                <MenuItem value="DATA_HEIST">Data Heist (Steal Coins)</MenuItem>
                <MenuItem value="SABOTAGE">Sabotage (Reduce Defense)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Target Venue</InputLabel>
              <Select
                value={selectedVenueId || ''}
                label="Target Venue"
                onChange={(e) => setSelectedVenueId(e.target.value)}
              >
                {allVenues?.venues?.filter((venue: any) => !dojos.some((d: any) => d.id === venue.id))
                  .map((venue: any) => (
                    <MenuItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={handleShadowRun}>
                Execute Run
              </Button>
              <Button variant="outlined" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Upgrade Modal */}
        <Modal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
          }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Upgrade Territory
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Upgrade Type</InputLabel>
              <Select
                value={upgradeType}
                label="Upgrade Type"
                onChange={(e) => setUpgradeType(e.target.value as 'income' | 'defense')}
              >
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="defense">Defense</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Territory</InputLabel>
              <Select
                value={upgradeVenueId || ''}
                label="Select Territory"
                onChange={(e) => setUpgradeVenueId(e.target.value)}
              >
                {dojos.map((dojo) => (
                  <MenuItem key={dojo.id} value={dojo.id}>
                    {dojo.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={handleUpgradeDojo}>
                Upgrade
              </Button>
              <Button variant="outlined" onClick={() => setUpgradeModalOpen(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>
      </Container>
      </PageBackground>
    </Layout>
  );
};

export default ClanProfile;

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
import VenueCard from '@/components/venue/VenueCard'; // Adjusted import path based on case
import { useAuth } from '@/hooks/useAuth';
import {
  getClanControlledDojos,
  getClanDetails,
  getClanShadowRuns,
  getVenues,
  initiateShadowRun,
  upgradeDojo,
} from '@/services/APIService';

interface ClanDetails {
  id: string;
  name: string;
  dojoCoinBalance: number;
  leaderId: string;
  // Add other fields as needed
}

// Using flexible typing for dojos on this page to match API shape

const ClanProfile = () => {
  const router = useRouter();
  const { clanId } = router.query;
  const { user } = useAuth();

  const [clan, setClan] = useState<ClanDetails | null>(null);
  const [dojos, setDojos] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shadowRuns, setShadowRuns] = useState<any[]>([]);
  const [openInitiate, setOpenInitiate] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [targetVenues, setTargetVenues] = useState<
    { id: string; name: string; controllingClanId?: string | null }[]
  >([]);

  const clanIdStr = Array.isArray(clanId) ? clanId[0] : clanId;

  const {
    data: clanData,
    error: clanError,
    isLoading: clanLoading,
  } = useSWR(
    () => (clanIdStr ? `/v1/clans/${clanIdStr}` : null),
    () => getClanDetails(clanIdStr as string)
  );

  const {
    data: dojosData,
    error: dojosError,
    isLoading: dojosLoading,
    mutate: mutateDojos,
  } = useSWR(
    () => (clanIdStr ? [`/v1/territories/clan`, clanIdStr] : null),
    () => getClanControlledDojos(clanIdStr as string)
  );

  useEffect(() => {
    if (clanData) setClan(clanData as ClanDetails);
    if (dojosData) setDojos(dojosData as any[]);
    setLoading(Boolean(clanLoading || dojosLoading));
  }, [clanData, dojosData, clanLoading, dojosLoading]);

  useEffect(() => {
    if (clan && user) {
      setIsLeader(clan.leaderId === user.id);
    }
  }, [clan, user]);

  const { data: runsData, mutate: mutateRuns } = useSWR(
    () =>
      tabValue === 2 && clanIdStr ? [`/v1/shadow-runs/clan`, clanIdStr] : null,
    () => getClanShadowRuns(clanIdStr as string)
  );
  useEffect(() => {
    if (runsData) setShadowRuns(runsData as any[]);
  }, [runsData]);

  useEffect(() => {
    if (openInitiate) {
      getVenues({ limit: 100 })
        .then((venues) => {
          const enemies = venues.venues.filter(
            (v) => v.controllingClanId !== clanIdStr
          );
          setTargetVenues(enemies);
        })
        .catch(console.error);
    }
  }, [openInitiate, clanIdStr]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenUpgrade = (venueId: string) => {
    setSelectedVenueId(venueId);
    setOpenModal(true);
  };

  const handleUpgrade = async (upgradeType: string) => {
    if (selectedVenueId) {
      try {
        await upgradeDojo(selectedVenueId, upgradeType);
        // Refresh dojos
        await mutateDojos();
      } catch (error) {
        console.error('Error upgrading dojo:', error);
      }
      setOpenModal(false);
      setSelectedVenueId(null);
    }
  };

  const upgrades = [
    { type: 'boost_income', cost: 100, effect: 'Boost Income' },
    { type: 'reinforce_defenses', cost: 150, effect: 'Reinforce Defenses' },
  ];

  if (loading) return <Typography>Loading...</Typography>;

  if (!clan) return <Typography>Clan not found</Typography>;

  return (
    <Layout>
      <PageBackground variant="social">
        <Container
          maxWidth="lg"
          sx={{ py: 4, position: 'relative', zIndex: 1 }}
        >
          <Typography variant="h3" sx={{ mb: 2 }}>
            {clan.name}
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Treasury: {clan.dojoCoinBalance} 💰
          </Typography>

          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Overview" />
            <Tab label="Territories" />
            <Tab label="Shadow Runs" />
          </Tabs>

          {tabValue === 1 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              {dojos.map((dojo) => (
                <Box key={dojo.id}>
                  <VenueCard
                    venue={dojo}
                    incomeRate={dojo.incomeRate}
                    defenseLevel={dojo.defenseLevel}
                    isLeader={isLeader}
                    onUpgrade={handleOpenUpgrade}
                  />
                </Box>
              ))}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Button
                variant="contained"
                onClick={() => setOpenInitiate(true)}
                sx={{ mb: 2 }}
              >
                Initiate Shadow Run
              </Button>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
                {shadowRuns.map((run) => (
                  <Box key={run.id}>
                    <Box
                      sx={{ p: 2, border: '1px solid gray', borderRadius: 2 }}
                    >
                      <Typography>Type: {run.type}</Typography>
                      <Typography>Status: {run.status}</Typography>
                      <Typography>Target: {run.targetVenue.name}</Typography>
                      <Typography>
                        Outcome: {run.outcome?.success ? 'Success' : 'Failed'}
                      </Typography>
                      <Typography>
                        Date: {new Date(run.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Modal open={openModal} onClose={() => setOpenModal(false)}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Available Upgrades
              </Typography>
              {upgrades.map((upgrade) => (
                <Box key={upgrade.type} sx={{ mb: 2 }}>
                  <Typography>{upgrade.effect}</Typography>
                  <Typography>Cost: {upgrade.cost} 💰</Typography>
                  <Button
                    variant="contained"
                    onClick={() => handleUpgrade(upgrade.type)}
                    sx={{ mt: 1 }}
                  >
                    Confirm
                  </Button>
                </Box>
              ))}
            </Box>
          </Modal>

          <Modal open={openInitiate} onClose={() => setOpenInitiate(false)}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                p: 4,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Initiate Shadow Run
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Run Type</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <MenuItem value="DATA_HEIST">Data Heist</MenuItem>
                  <MenuItem value="SABOTAGE">Sabotage</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Target Venue</InputLabel>
                <Select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                >
                  {targetVenues.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={async () => {
                  if (selectedType && selectedTarget && clanIdStr) {
                    await initiateShadowRun(selectedTarget, selectedType);
                    setOpenInitiate(false);
                    await mutateRuns();
                  }
                }}
              >
                Confirm
              </Button>
            </Box>
          </Modal>
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default ClanProfile;

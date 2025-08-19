import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Map from '../frontend/components/Map/Map';
import { Box, Typography, Alert } from '@mui/material';
import {
  getTerritories,
  getUserNFTs,
  type Territory,
} from '../services/territory/TerritoryService';

// Mock user and NFT trophy logic for MVP
const mockUserId = 'user_001';

const WorldMap: React.FC = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [userNFTs, setUserNFTs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [territoriesData, userNFTsData] = await Promise.all([
        getTerritories(),
        getUserNFTs(mockUserId),
      ]);
      setTerritories(territoriesData);
      setUserNFTs(userNFTsData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const unlockedTerritories = territories.map((t) => ({
    ...t,
    isLocked: !userNFTs.includes(t.requiredNFT),
  }));

  return (
    <Layout>
      <Typography variant="h4" sx={{ mb: 2 }}>
        World Map
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Explore Dojo territories. Locked areas require NFT trophies to enter.
      </Typography>
      <Box sx={{ height: 600, width: '100%' }}>
        {loading ? (
          <Typography>Loading map...</Typography>
        ) : (
          <Map
            unlockedTerritories={unlockedTerritories}
            userNFTs={userNFTs}
            userId={mockUserId}
          />
        )}
      </Box>
      <Alert severity="info" sx={{ mt: 2 }}>
        This is a prototype. Territory/NFT data is mocked. Real data and
        overlays coming next.
      </Alert>
    </Layout>
  );
};

export default WorldMap;

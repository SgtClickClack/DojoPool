import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import AvatarCreationFlow from '../src/components/avatar/AvatarCreationFlow';

const AvatarCreationTestPage: React.FC = () => {
  const handleAvatarComplete = (avatarId: string) => {
    console.log('Avatar creation completed:', avatarId);
    alert(`Avatar created successfully! ID: ${avatarId}`);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            DojoPool Avatar Creation System
          </Typography>
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            align="center"
            color="text.secondary"
          >
            Phase 1 MVP - 3D Scanning, Mesh Processing & Wardrobe Selection
          </Typography>

          <Box
            sx={{
              mt: 4,
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              🎯 Phase 1 Features Implemented:
            </Typography>
            <Typography variant="body1" component="div">
              • ✅ Backend Avatar Processing Service
              <br />
              • ✅ Wardrobe System with 5 Initial Clothing Items
              <br />
              • ✅ Base Mesh Fitting with Laplacian Mesh Deformation
              <br />
              • ✅ Asset Delivery Pipeline (Draco + KTX2 Optimization)
              <br />
              • ✅ Complete Web-based Avatar Creation Flow
              <br />
              • ⚠️ Mobile scanning framework (needs native modules)
              <br />
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'info.main',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              📋 Test Instructions:
            </Typography>
            <Typography variant="body1" component="div">
              1. Click "Photogrammetry Demo" to simulate 3D scanning
              <br />
              2. Watch the base mesh processing simulation
              <br />
              3. Select clothing items from the 5-item wardrobe
              <br />
              4. Create your avatar and download the GLB file
              <br />
              5. Verify the final avatar loads in under 3 seconds
              <br />
            </Typography>
          </Box>
        </Paper>

        <AvatarCreationFlow
          userId="test-user-123"
          onComplete={handleAvatarComplete}
        />
      </Box>
    </Container>
  );
};

export default AvatarCreationTestPage;

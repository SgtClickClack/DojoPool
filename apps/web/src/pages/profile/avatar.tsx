import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

// Dynamically import the avatar customization component
const AvatarCustomization = dynamic(
  () => import('@/components/avatar/AvatarCustomization'),
  { ssr: false }
);

const AvatarPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <>
      <Head>
        <title>Avatar Customization - DojoPool</title>
        <meta
          name="description"
          content="Customize your avatar and express your unique style in DojoPool"
        />
      </Head>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              mb: 2,
              background: 'linear-gradient(45deg, #00ff9d 30%, #00a8ff 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Avatar Customization
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              mb: 4,
            }}
          >
            Express your unique style and build your digital identity
          </Typography>
        </Box>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            background: 'rgba(26, 26, 46, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}
        >
          <Alert
            severity="info"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(0, 168, 255, 0.1)',
              color: '#00a8ff',
              '& .MuiAlert-icon': {
                color: '#00a8ff',
              },
            }}
          >
            Customize your avatar to reflect your personality and gaming style.
            Unlock new customization options by playing matches and completing
            achievements!
          </Alert>

          <AvatarCustomization />
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/profile')}
            sx={{
              borderColor: '#00ff9d',
              color: '#00ff9d',
              '&:hover': {
                borderColor: '#00cc7a',
                color: '#00cc7a',
                backgroundColor: 'rgba(0, 255, 157, 0.1)',
              },
            }}
          >
            Back to Profile
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default AvatarPage;

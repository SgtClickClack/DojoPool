import { useAuth } from '@/hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireModerator?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireModerator = false,
}) => {
  const { user, loading, isAdmin, isModerator } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        void router.push('/login');
      } else if (requireAdmin && !isAdmin) {
        void router.push('/dashboard');
      }
    }
  }, [
    user,
    loading,
    isAdmin,
    isModerator,
    requireAdmin,
    requireModerator,
    router,
  ]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (requireAdmin && !isAdmin) {
    return null; // Will redirect to dashboard
  }

  if (requireModerator && !(isAdmin || isModerator)) {
    return null; // Will redirect to dashboard
  }

  return <>{children}</>;
};

export default ProtectedRoute;

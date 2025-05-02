import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useUser } from '../hooks/useUser';
import { useLocation } from '../hooks/useLocation';
import QRCodeScanner from './QRCodeScanner';

interface CheckInVerifierProps {
  tournamentId: string;
}

const CheckInVerifier: React.FC<CheckInVerifierProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { tournament, loading, error } = useTournament(tournamentId);
  const { user } = useUser();
  const [location, locationError] = useLocation();
  const [scannedCode, setScannedCode] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleScan = (code: string) => {
    setScannedCode(code);
    setDialogOpen(true);
  };

  const verifyCheckIn = async () => {
    if (!tournament || !user || !scannedCode || !location) return;

    setVerifying(true);
    setVerificationError(null);

    try {
      // Verify geolocation
      const tournamentLocation = tournament.location;
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        tournamentLocation.latitude,
        tournamentLocation.longitude
      );

      if (distance > 50) { // 50 meters threshold
        throw new Error('You must be within 50 meters of the tournament venue');
      }

      // Verify QR code
      const response = await fetch(`/api/tournaments/${tournament.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkInCode: scannedCode,
          userId: user.id,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify check-in');
      }

      // Update user's check-in status
      await fetch(`/api/users/${user.id}/tournaments/${tournament.id}/checkin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkedIn: true,
          checkInTime: new Date().toISOString(),
        }),
      });

      navigate(`/tournaments/${tournament.id}/checked-in`);
    } catch (err) {
      setVerificationError(
        err instanceof Error ? err.message : 'Failed to verify check-in'
      );
    } finally {
      setVerifying(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tournament Check-in Verification
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Details
          </Typography>
          <Typography variant="body1">
            Name: {tournament.name}
          </Typography>
          <Typography variant="body1">
            Venue: {tournament.venue.name}
          </Typography>
          <Typography variant="body1">
            Status: {tournament.status}
          </Typography>
        </CardContent>
      </Card>

      {locationError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {locationError}
        </Alert>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Location
            </Typography>
            <Typography variant="body1">
              Latitude: {location?.latitude?.toFixed(6)}
            </Typography>
            <Typography variant="body1">
              Longitude: {location?.longitude?.toFixed(6)}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Scan QR Code
          </Typography>
          <QRCodeScanner onScan={handleScan} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Verify Check-in</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Scanned Code: {scannedCode}
          </Typography>
          <Typography color="text.secondary">
            Please verify that this is your check-in code before proceeding.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={verifyCheckIn}
            variant="contained"
            color="primary"
            disabled={verifying}
          >
            {verifying ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Verifying...
              </>
            ) : (
              'Verify Check-in'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {verificationError && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {verificationError}
        </Alert>
      )}
    </Box>
  );
};

export default CheckInVerifier;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import QrReader from 'react-qr-reader';
import { Tournament } from '../../types/tournament';
import { useAuth } from '../../hooks/useAuth';
import { checkInForTournament } from '../../services/tournament';

interface TournamentCheckInProps {
  tournament: Tournament;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

export const TournamentCheckIn: React.FC<TournamentCheckInProps> = ({
  tournament,
  open,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [step, setStep] = useState<'qr' | 'location' | 'verifying'>('qr');

  useEffect(() => {
    if (step === 'location') {
      requestLocation();
    }
  }, [step]);

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          verifyCheckIn(qrData!, position);
        },
        (error) => {
          setError('Failed to get your location. Please enable location services and try again.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleQrScan = (data: string | null) => {
    if (data) {
      setQrData(data);
      setStep('location');
    }
  };

  const handleQrError = (err: any) => {
    setError('Failed to scan QR code. Please try again.');
  };

  const verifyCheckIn = async (qrCode: string, position: GeolocationPosition) => {
    try {
      setStep('verifying');
      setLoading(true);
      setError(null);

      await checkInForTournament(tournament.id, {
        qrCode,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to check in. Please verify you are at the correct venue and try again.');
      setStep('qr');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'qr':
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Please scan the venue's QR code to check in for the tournament.
            </Typography>
            <Box sx={{ mt: 2, mb: 2 }}>
              <QrReader
                delay={300}
                onError={handleQrError}
                onScan={handleQrScan}
                style={{ width: '100%' }}
              />
            </Box>
          </Box>
        );
      case 'location':
        return (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Verifying your location...
            </Typography>
          </Box>
        );
      case 'verifying':
        return (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Checking you in...
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: theme.palette.background.paper,
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        Tournament Check-In
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderContent()}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 
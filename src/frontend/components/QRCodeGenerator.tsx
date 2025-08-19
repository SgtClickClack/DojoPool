import { useUser } from '@/hooks/useUser';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';

interface QRCodeGeneratorProps {
  tournamentId: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const {
    tournament,
    loading,
    error: tournamentError,
  } = useTournament(tournamentId);
  const { user } = useUser();
  const [qrCode, setQRCode] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const generateQRCode = async () => {
    if (!tournament || !user) return;

    setGenerating(true);
    setError(null);

    try {
      // Generate unique check-in code
      const checkInCode = `${tournament.id}-${user.id}-${Date.now()}`;

      // Generate QR code
      setQRCode(checkInCode);

      // Save check-in code to user's tournament record
      await fetch(`/api/tournaments/${tournament.id}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          checkInCode,
          timestamp: new Date().toISOString(),
        }),
      });

      navigate(`/tournaments/${tournament.id}/checkin`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate QR code'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tournamentError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{tournamentError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tournament Check-in
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Details
          </Typography>
          <Typography variant="body1">Name: {tournament.name}</Typography>
          <Typography variant="body1">
            Type: {tournament.type.replace('_', ' ')}
          </Typography>
          <Typography variant="body1">Status: {tournament.status}</Typography>
        </CardContent>
      </Card>

      {qrCode ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Check-in QR Code
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <QRCodeSVG
                value={qrCode}
                size={256}
                level="H"
                includeMargin={true}
              />
            </Box>
            <Typography variant="body1" color="text.secondary">
              Show this QR code to the tournament staff for check-in
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={generateQRCode}
          disabled={generating}
          sx={{ mt: 3 }}
        >
          {generating ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Generating QR Code...
            </>
          ) : (
            'Generate Check-in QR Code'
          )}
        </Button>
      )}
    </Box>
  );
};

export default QRCodeGenerator;

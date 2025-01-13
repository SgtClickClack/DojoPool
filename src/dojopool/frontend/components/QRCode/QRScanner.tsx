import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

const ScannerContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '500px',
  margin: '0 auto',
  '& video': {
    width: '100%',
    borderRadius: theme.shape.borderRadius,
  },
}));

const ScannerOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.5)',
  borderRadius: theme.shape.borderRadius,
}));

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        // Check camera permissions
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          throw new Error('No camera found');
        }

        // Create video element
        if (!videoRef.current) {
          return;
        }

        // Initialize scanner
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            onScan(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        // Start scanning
        await qrScanner.start();
        scannerRef.current = qrScanner;
        setHasPermission(true);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize scanner');
        setIsLoading(false);
        if (onError) {
          onError(err instanceof Error ? err.message : 'Scanner error');
        }
      }
    };

    initializeScanner();

    // Cleanup
    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
    };
  }, [onScan, onError]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (scannerRef.current) {
      scannerRef.current.start();
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.destroy();
    }
    if (onClose) {
      onClose();
    }
  };

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Box mt={2}>
          <Button onClick={handleRetry} variant="contained" sx={{ mr: 1 }}>
            Retry
          </Button>
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <ScannerContainer>
      <video ref={videoRef} />

      {isLoading && (
        <ScannerOverlay>
          <CircularProgress color="primary" />
          <Typography color="white" sx={{ mt: 2 }}>
            Initializing camera...
          </Typography>
        </ScannerOverlay>
      )}

      {!hasPermission && !isLoading && (
        <ScannerOverlay>
          <Typography color="white" gutterBottom>
            Camera access required
          </Typography>
          <Button variant="contained" onClick={handleRetry} sx={{ mt: 2 }}>
            Grant Access
          </Button>
        </ScannerOverlay>
      )}
    </ScannerContainer>
  );
};

export default QRScanner;

import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { api } from '../services/api';

interface QRScannerProps {
  onScanSuccess?: (result: any) => void;
  onScanError?: (error: string) => void;
  venueId?: string;
  tableId?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  venueId,
  tableId
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  useEffect(() => {
    // Load QR code if venue and table IDs are provided
    if (venueId && tableId) {
      loadQRCode();
    }
  }, [venueId, tableId]);
  
  const loadQRCode = async () => {
    if (!venueId || !tableId) return;
    
    try {
      setLoading(true);
      const response = await api.get(
        `/venues/${venueId}/tables/${tableId}/qr`
      );
      setQrCode(response.data.qr_code);
    } catch (error) {
      console.error('Error loading QR code:', error);
      enqueueSnackbar('Failed to load QR code', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const refreshQRCode = async () => {
    if (!venueId || !tableId) return;
    
    try {
      setLoading(true);
      const response = await api.post(
        `/venues/${venueId}/tables/${tableId}/qr/refresh`
      );
      setQrCode(response.data.qr_code);
      enqueueSnackbar('QR code refreshed', { variant: 'success' });
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      enqueueSnackbar('Failed to refresh QR code', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleScan = async (data: string | null) => {
    if (!data) return;
    
    try {
      setLoading(true);
      const response = await api.post('/qr/verify', {
        qr_data: data
      });
      
      if (response.data.valid) {
        enqueueSnackbar('QR code verified successfully', { variant: 'success' });
        onScanSuccess?.(response.data);
        setScanning(false);
      } else {
        throw new Error(response.data.error || 'Invalid QR code');
      }
    } catch (error: any) {
      console.error('Error verifying QR code:', error);
      const errorMessage = error.response?.data?.error || error.message;
      enqueueSnackbar(errorMessage, { variant: 'error' });
      onScanError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleError = (error: Error) => {
    console.error('QR Scanner error:', error);
    enqueueSnackbar('Error accessing camera', { variant: 'error' });
    onScanError?.('Error accessing camera');
    setScanning(false);
  };
  
  return (
    <Box>
      {/* QR Code Display */}
      {qrCode && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" component="div">
                Table QR Code
              </Typography>
              <IconButton onClick={refreshQRCode} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Box>
            
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              my={2}
              position="relative"
            >
              {loading ? (
                <CircularProgress />
              ) : (
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="Table QR Code"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* Scan Button */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<QrCodeIcon />}
        onClick={() => setScanning(true)}
        disabled={loading}
        fullWidth
      >
        Scan QR Code
      </Button>
      
      {/* Scanner Dialog */}
      <Dialog
        open={scanning}
        onClose={() => setScanning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            Scan QR Code
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setScanning(false)}
              disabled={loading}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box position="relative">
            {loading && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgcolor="rgba(255, 255, 255, 0.8)"
                zIndex={1}
              >
                <CircularProgress />
              </Box>
            )}
            
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={(result) => {
                if (result) {
                  handleScan(result.getText());
                }
              }}
              containerStyle={{ width: '100%' }}
              videoStyle={{ width: '100%' }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={() => setScanning(false)}
            color="primary"
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 
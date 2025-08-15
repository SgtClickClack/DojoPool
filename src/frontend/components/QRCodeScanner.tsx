import React, { useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Camera } from '@mui/icons-material';
import { useMediaDevices } from '../hooks/useMediaDevices';

interface QRCodeScannerProps {
  onScan: (code: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devices, getDevices, deviceError] = useMediaDevices();
  const [selectedDevice, setSelectedDevice] = React.useState<string | null>(null);

  useEffect(() => {
    if (deviceError) {
      setError(deviceError);
    }
  }, [deviceError]);

  useEffect(() => {
    if (devices && devices.length > 0) {
      setSelectedDevice(devices[0].deviceId);
    }
  }, [devices]);

  const startScanning = async () => {
    if (!selectedDevice) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDevice,
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setScanning(true);
      setError(null);

      const detectQR = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        ctx.drawImage(videoRef.current, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = detectQRCode(imageData);

        if (code) {
          onScan(code);
          stopScanning();
        }

        if (scanning) {
          requestAnimationFrame(detectQR);
        }
      };

      detectQR();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start camera'
      );
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  const detectQRCode = (imageData: ImageData): string | null => {
    // This is a placeholder - in a real implementation you would use a QR code detection library
    // like jsQR or QuaggaJS
    return null;
  };

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDevice(event.target.value);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: 'scaleX(-1)', // Flip horizontally for better UX
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <Box>
          <Typography variant="h6" color="white">
            Scan QR Code
          </Typography>
          <Typography variant="body2" color="white" sx={{ mt: 1 }}>
            Point your camera at the QR code to check in
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={scanning ? stopScanning : startScanning}
            color="primary"
          >
            {scanning ? (
              <CircularProgress size={24} />
            ) : (
              <Camera />
            )}
          </IconButton>
          <select
            value={selectedDevice || ''}
            onChange={handleDeviceChange}
            style={{
              padding: '8px',
              borderRadius: '4px',
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <option value="">Select Camera</option>
            {devices?.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId}`}
              </option>
            ))}
          </select>
        </Box>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default QRCodeScanner;

import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Camera,
  CameraAlt,
  Stop,
  FlipCameraIos,
  QrCodeScanner as QrIcon,
} from '@mui/icons-material';

interface QRCodeScannerProps {
  onScan: (code: string) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan }) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
    purple: '#8b00ff',
    orange: '#ff6600',
  };

  useEffect(() => {
    // Get available cameras
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      const videoDevices = deviceInfos.filter(
        (device) => device.kind === 'videoinput'
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          facingMode: selectedDeviceId ? undefined : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setScanning(true);
        setError(null);

        // Start scanning after video is playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          scanQRCode();
        };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // This is where you would integrate a real QR code detection library
    // For now, we'll simulate detection
    const detectedCode = detectQRCodeFromImageData(imageData);

    if (detectedCode) {
      onScan(detectedCode);
      stopScanning();
    } else {
      // Continue scanning
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  // Placeholder function - replace with actual QR detection library
  const detectQRCodeFromImageData = (imageData: ImageData): string | null => {
    // In production, use a library like jsQR:
    // import jsQR from 'jsqr';
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    // return code ? code.data : null;

    // For demo purposes, simulate occasional detection
    if (Math.random() < 0.01) {
      return 'DEMO-QR-CODE-' + Date.now();
    }
    return null;
  };

  const handleDeviceChange = (event: any) => {
    const newDeviceId = event.target.value;
    setSelectedDeviceId(newDeviceId);

    if (scanning) {
      stopScanning();
      setTimeout(() => {
        startScanning();
      }, 100);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 400,
        background: alpha(theme.palette.background.default, 0.95),
        border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: scanning ? 'block' : 'none',
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Scanning overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: scanning ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
        }}
      >
        {!scanning && !error && (
          <Box sx={{ textAlign: 'center' }}>
            <QrIcon
              sx={{
                fontSize: 80,
                color: neonColors.primary,
                mb: 2,
                filter: `drop-shadow(0 0 20px ${neonColors.primary})`,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            />
            <Typography
              variant="h5"
              sx={{
                color: neonColors.primary,
                textShadow: `0 0 10px ${neonColors.primary}`,
                mb: 1,
              }}
            >
              QR Code Scanner
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Click the camera button to start scanning
            </Typography>
          </Box>
        )}

        {scanning && (
          <>
            {/* Scanning frame */}
            <Box
              sx={{
                position: 'absolute',
                width: '250px',
                height: '250px',
                border: `3px solid ${neonColors.primary}`,
                borderRadius: 2,
                boxShadow: `0 0 20px ${neonColors.primary}`,
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  width: '30px',
                  height: '30px',
                  border: `4px solid ${neonColors.info}`,
                  borderRadius: 1,
                },
                '&::before': {
                  top: -2,
                  left: -2,
                  borderRight: 'none',
                  borderBottom: 'none',
                },
                '&::after': {
                  bottom: -2,
                  right: -2,
                  borderLeft: 'none',
                  borderTop: 'none',
                },
              }}
            >
              {/* Scanning line animation */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, transparent, ${neonColors.info}, transparent)`,
                  boxShadow: `0 0 10px ${neonColors.info}`,
                  animation: 'scan 2s linear infinite',
                  '@keyframes scan': {
                    '0%': { top: 0 },
                    '50%': { top: 'calc(100% - 3px)' },
                    '100%': { top: 0 },
                  },
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{
                position: 'absolute',
                bottom: 120,
                color: theme.palette.common.white,
                textAlign: 'center',
                px: 2,
              }}
            >
              Position the QR code within the frame
            </Typography>
          </>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              background: alpha(neonColors.error, 0.1),
              border: `1px solid ${neonColors.error}`,
              color: neonColors.error,
              '& .MuiAlert-icon': { color: neonColors.error },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <IconButton
            onClick={scanning ? stopScanning : startScanning}
            sx={{
              background: alpha(
                scanning ? neonColors.error : neonColors.primary,
                0.2
              ),
              border: `2px solid ${scanning ? neonColors.error : neonColors.primary}`,
              color: scanning ? neonColors.error : neonColors.primary,
              '&:hover': {
                background: alpha(
                  scanning ? neonColors.error : neonColors.primary,
                  0.3
                ),
              },
            }}
          >
            {scanning ? <Stop /> : <Camera />}
          </IconButton>

          {devices.length > 1 && (
            <FormControl
              size="small"
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  color: theme.palette.common.white,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  '& fieldset': {
                    borderColor: alpha(neonColors.primary, 0.3),
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(neonColors.primary, 0.5),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: neonColors.primary,
                  },
                },
              }}
            >
              <Select
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                size="small"
              >
                {devices.map((device) => (
                  <MenuItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {scanning && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${neonColors.primary} 0%, ${neonColors.info} 100%)`,
            },
          }}
        />
      )}
    </Box>
  );
};

export default QRCodeScanner;

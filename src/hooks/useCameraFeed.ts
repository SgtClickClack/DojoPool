import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseCameraFeedReturn {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
  isCapturing: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  startFrameCapture: () => void;
  stopFrameCapture: () => void;
}

/**
 * Custom hook for managing camera feed in React components
 * Includes functionality for capturing frames and sending them to the backend
 * 
 * @returns {UseCameraFeedReturn} Object containing video ref, canvas ref, stream state, error state, and control functions
 */
const useCameraFeed = (): UseCameraFeedReturn => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const captureIntervalRef = useRef<number | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socketOptions = {
      transports: ['websocket'],
      autoConnect: true
    };

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || '/socket.io', socketOptions);

    newSocket.on('connect', () => {
      console.log('Connected to AI Referee socket');
    });

    newSocket.on('error', (err: Error) => {
      console.error('Socket error:', err);
      setError(`Socket error: ${err.message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  /**
   * Requests access to the user's camera and sets up the video stream
   */
  const startCamera = async (): Promise<void> => {
    // Reset states
    setError(null);
    setIsLoading(true);

    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Set the stream state
      setStream(mediaStream);
      
      // Connect the stream to the video element if the ref is available
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      // Handle different types of errors
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access to use this feature.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is already in use by another application.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred while accessing the camera.');
      }
      
      console.error('Camera access error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Stops all tracks in the media stream and cleans up
   */
  const stopCamera = (): void => {
    // Stop frame capturing if it's active
    stopFrameCapture();
    
    if (stream) {
      // Stop all tracks in the stream
      stream.getTracks().forEach(track => track.stop());
      
      // Clear the stream state
      setStream(null);
      
      // Clear the video element source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  /**
   * Captures a single frame from the video element and returns it as a Base64-encoded JPEG string
   */
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame from the video onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas image to a Base64-encoded JPEG string
    return canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality to reduce size
  };

  /**
   * Starts capturing frames from the video element at regular intervals
   * and sends them to the backend for analysis
   */
  const startFrameCapture = (): void => {
    if (!stream || !socket || isCapturing) {
      return;
    }

    setIsCapturing(true);

    // Capture frames at a rate of 10 frames per second (100ms interval)
    captureIntervalRef.current = window.setInterval(() => {
      const frameData = captureFrame();
      
      if (frameData) {
        // Emit the frame data to the backend
        socket.emit('video_frame', {
          frame: frameData,
          timestamp: Date.now()
        });
      }
    }, 100);
  };

  /**
   * Stops capturing frames
   */
  const stopFrameCapture = (): void => {
    if (captureIntervalRef.current !== null) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    
    setIsCapturing(false);
  };

  // Clean up resources when the component unmounts
  useEffect(() => {
    return () => {
      stopFrameCapture();
      stopCamera();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return {
    videoRef,
    canvasRef,
    stream,
    error,
    isLoading,
    isCapturing,
    startCamera,
    stopCamera,
    startFrameCapture,
    stopFrameCapture
  };
};

export default useCameraFeed;
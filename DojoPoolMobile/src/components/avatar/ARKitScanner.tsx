import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import AvatarCreationService from '../../services/AvatarCreationService';

interface ARKitScannerProps {
  userId: string;
  onScanComplete: (scanId: string) => void;
  onCancel: () => void;
}

interface ScanStep {
  id: string;
  title: string;
  instruction: string;
  duration: number;
  completed: boolean;
}

const ARKitScanner: React.FC<ARKitScannerProps> = ({
  userId,
  onScanComplete,
  onCancel,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningComplete, setScanningComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const frontCamera = devices.front;

  const scanSteps: ScanStep[] = [
    {
      id: 'front',
      title: 'Face Forward',
      instruction: 'Look directly at the camera. Keep your face centered.',
      duration: 3000,
      completed: false,
    },
    {
      id: 'left',
      title: 'Turn Left',
      instruction: 'Slowly turn your head to the left.',
      duration: 2000,
      completed: false,
    },
    {
      id: 'right',
      title: 'Turn Right',
      instruction: 'Slowly turn your head to the right.',
      duration: 2000,
      completed: false,
    },
    {
      id: 'up',
      title: 'Look Up',
      instruction: 'Tilt your head slightly upward.',
      duration: 2000,
      completed: false,
    },
    {
      id: 'down',
      title: 'Look Down',
      instruction: 'Tilt your head slightly downward.',
      duration: 2000,
      completed: false,
    },
  ];

  const initializeScanning = useCallback(async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('Error', 'ARKit scanning is only available on iOS devices');
        return;
      }

      const response = await AvatarCreationService.initializeARKitScanning(userId);
      setSessionId(response.sessionId);
      setIsScanning(true);
      setCurrentStep(0);
      setScanProgress(0);
    } catch (error) {
      console.error('Failed to initialize ARKit scanning:', error);
      Alert.alert('Error', 'Failed to initialize scanning session');
    }
  }, [userId]);

  const startScanningSequence = useCallback(async () => {
    if (!sessionId) return;

    let stepIndex = 0;
    const totalSteps = scanSteps.length;

    const processStep = async () => {
      if (stepIndex >= totalSteps) {
        setScanningComplete(true);
        await completeScan();
        return;
      }

      const step = scanSteps[stepIndex];
      setCurrentStep(stepIndex);

      // Simulate step progression
      setTimeout(() => {
        setScanProgress((stepIndex + 1) / totalSteps * 100);
        stepIndex++;
        processStep();
      }, step.duration);
    };

    processStep();
  }, [sessionId]);

  const completeScan = useCallback(async () => {
    if (!sessionId) return;

    setIsProcessing(true);
    
    try {
      // Simulate capturing USDZ data from ARKit
      // In a real implementation, this would use ARKit's ObjectCapture framework
      const mockUsdzData = generateMockUsdzData();
      const metadata = {
        deviceInfo: Platform.constants.interfaceIdiom || 'iPhone',
        scanQuality: 0.85,
        timestamp: new Date().toISOString(),
        facePoints: generateMockFacePoints(),
        bodyMeasurements: {
          height: 170,
          shoulderWidth: 40,
          chestWidth: 35,
        },
      };

      const response = await AvatarCreationService.submitARKitScan(sessionId, {
        usdzDataBase64: mockUsdzData,
        metadata,
      });

      onScanComplete(response.scanId);
    } catch (error) {
      console.error('Failed to submit scan:', error);
      Alert.alert('Error', 'Failed to submit scan data');
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, onScanComplete]);

  const generateMockUsdzData = (): string => {
    // Generate mock USDZ data as base64
    // In production, this would be real ARKit ObjectCapture data
    const mockData = new Array(1000).fill(0).map(() => Math.floor(Math.random() * 256));
    return Buffer.from(mockData).toString('base64');
  };

  const generateMockFacePoints = (): number[] => {
    // Generate mock facial feature points
    const points: number[] = [];
    for (let i = 0; i < 468; i++) { // ARKit face mesh has 468 vertices
      points.push(Math.random() * 640); // x
      points.push(Math.random() * 480); // y
      points.push(Math.random() * 100); // z
    }
    return points;
  };

  if (!frontCamera) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera not available</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isScanning ? (
        <View style={styles.setupContainer}>
          <Text style={styles.title}>ARKit 3D Face Scan</Text>
          <Text style={styles.subtitle}>
            We'll guide you through a quick 3D scan to create your avatar
          </Text>
          
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionTitle}>Before we start:</Text>
            <Text style={styles.instruction}>• Ensure good lighting</Text>
            <Text style={styles.instruction}>• Remove glasses if possible</Text>
            <Text style={styles.instruction}>• Keep hair away from face</Text>
            <Text style={styles.instruction}>• Hold device at arm's length</Text>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={initializeScanning}
          >
            <Text style={styles.startButtonText}>Start Scanning</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.scanningContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={frontCamera}
            isActive={true}
            faceDetection="accurate"
          />
          
          <View style={styles.overlay}>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {Math.round(scanProgress)}% Complete
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${scanProgress}%` }]}
                />
              </View>
            </View>

            {!scanningComplete && !isProcessing && (
              <View style={styles.instructionContainer}>
                <Text style={styles.stepTitle}>
                  Step {currentStep + 1} of {scanSteps.length}
                </Text>
                <Text style={styles.stepTitle}>
                  {scanSteps[currentStep]?.title}
                </Text>
                <Text style={styles.stepInstruction}>
                  {scanSteps[currentStep]?.instruction}
                </Text>
              </View>
            )}

            {scanningComplete && (
              <View style={styles.instructionContainer}>
                <Text style={styles.stepTitle}>Scan Complete!</Text>
                <Text style={styles.stepInstruction}>
                  Processing your 3D avatar...
                </Text>
              </View>
            )}

            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.processingText}>
                  Creating your avatar...
                </Text>
              </View>
            )}

            {!scanningComplete && !isProcessing && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={startScanningSequence}
              >
                <Text style={styles.scanButtonText}>Begin Scan</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  setupContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  instruction: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#888888',
  },
  scanningContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  instructionContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepInstruction: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: 'center',
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  processingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 30,
    borderRadius: 10,
  },
  processingText: {
    fontSize: 16,
    color: '#FFD700',
    marginTop: 15,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});

export default ARKitScanner;
import { Camera } from 'react-native-vision-camera';
import { Platform } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
    });

    if (!permission) {
      console.error('Platform not supported');
      return false;
    }

    const result = await check(permission);

    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    }

    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

export const initializeCamera = async (): Promise<{
  hasPermission: boolean;
  devices: any[];
}> => {
  try {
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      return {
        hasPermission: false,
        devices: [],
      };
    }

    const devices = await Camera.getAvailableCameraDevices();
    const sortedDevices = devices.sort((a, b) => {
      if (a.position === 'back' && b.position !== 'back') return -1;
      if (a.position !== 'back' && b.position === 'back') return 1;
      return 0;
    });

    return {
      hasPermission: true,
      devices: sortedDevices,
    };
  } catch (error) {
    console.error('Error initializing camera:', error);
    return {
      hasPermission: false,
      devices: [],
    };
  }
};

export const getCameraDevice = async () => {
  const { devices } = await initializeCamera();
  return devices.find(device => device.position === 'back') || devices[0];
};

export const formatCameraError = (error: any): string => {
  if (typeof error === 'string') return error;
  
  const errorMap: { [key: string]: string } = {
    'permission-denied': 'Camera permission was denied',
    'device-not-found': 'No camera device was found',
    'invalid-parameter': 'Invalid camera parameters',
    'system-error': 'System error occurred while accessing camera',
  };

  return errorMap[error.code] || 'An unknown error occurred';
}; 
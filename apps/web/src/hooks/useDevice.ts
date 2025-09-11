import { useEffect, useState } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  userAgent: string;
  touchEnabled: boolean;
  pixelRatio: number;
}

export const useDevice = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
    orientation: 'landscape',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    touchEnabled: false,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Determine device type
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      const isDesktop = width > 1024;

      // Determine orientation
      const orientation = height > width ? 'portrait' : 'landscape';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        orientation,
        userAgent: window.navigator.userAgent,
        touchEnabled: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pixelRatio: window.devicePixelRatio || 1,
      });
    };

    // Initial update
    updateDeviceInfo();

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

export const useIsMobile = (): boolean => {
  const { isMobile } = useDevice();
  return isMobile;
};

export const useIsTablet = (): boolean => {
  const { isTablet } = useDevice();
  return isTablet;
};

export const useIsDesktop = (): boolean => {
  const { isDesktop } = useDevice();
  return isDesktop;
};

export const useOrientation = (): 'portrait' | 'landscape' => {
  const { orientation } = useDevice();
  return orientation;
};

export const useScreenSize = (): { width: number; height: number } => {
  const { screenWidth, screenHeight } = useDevice();
  return { width: screenWidth, height: screenHeight };
};

// Mobile-specific breakpoints
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
} as const;

// Helper functions
export const isMobileWidth = (width: number): boolean =>
  width <= breakpoints.mobile;
export const isTabletWidth = (width: number): boolean =>
  width > breakpoints.mobile && width <= breakpoints.tablet;
export const isDesktopWidth = (width: number): boolean =>
  width > breakpoints.tablet;

// Touch detection
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Mobile OS detection
export const getMobileOS = (): 'iOS' | 'Android' | 'Windows' | 'Other' => {
  if (typeof window === 'undefined') return 'Other';

  const userAgent = window.navigator.userAgent;

  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return 'iOS';
  } else if (/Android/.test(userAgent)) {
    return 'Android';
  } else if (/Windows/.test(userAgent)) {
    return 'Windows';
  }

  return 'Other';
};

// PWA detection
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check if app is running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as any).standalone === true;

  return isStandalone || isInWebAppiOS;
};

// Network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionType = () => {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    updateNetworkStatus();
    updateConnectionType();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes if supported
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener(
        'change',
        updateConnectionType
      );
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);

      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener(
          'change',
          updateConnectionType
        );
      }
    };
  }, []);

  return { isOnline, connectionType };
};
